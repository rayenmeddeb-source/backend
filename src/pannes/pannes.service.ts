import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Panne } from './panne.entity';
import { ChatbotRulesService } from '../chatbot-rules/chatbot-rules.service';

@Injectable()
export class PannesService {
  private static readonly TOKEN_SYNONYMS: Record<string, string[]> = {
    surchauffe: ['surchoffe', 'chauffe', 'temperature', 'vapeur', 'radiateur'],
    moteur: ['moter', 'bloc', 'machine'],
    batterie: ['pile', 'accumulateur'],
    demarre: ['demarrage', 'allume', 'lance'],
    demarreur: ['starter', 'solenoide'],
    frein: ['freinage', 'plaquette', 'disque', 'pedale'],
    clim: ['climatisation', 'air', 'froid', 'ventilation'],
    pneu: ['roue', 'gomme'],
    pression: ['gonflage'],
    volant: ['direction'],
    fuite: ['perte', 'ecoulement'],
    huile: ['lubrifiant'],
    carburant: ['essence', 'diesel', 'gazole'],
    fumee: ['fumee', 'vapeur'],
    boite: ['transmission', 'vitesse'],
    embrayage: ['pedale', 'kit'],
    bruit: ['son', 'claquement', 'cliquetis', 'grincement'],
    voyant: ['temoin', 'alerte', 'warning'],
  };

  constructor(
    @InjectRepository(Panne)
    private readonly pannesRepository: Repository<Panne>,
    private readonly chatbotRulesService: ChatbotRulesService,
  ) {}

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private tokenize(value: string): string[] {
    return this.normalizeText(value)
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 1);
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
      new Array<number>(b.length + 1).fill(0),
    );

    for (let i = 0; i <= a.length; i += 1) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= b.length; j += 1) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    return matrix[a.length][b.length];
  }

  private tokenMatches(sourceToken: string, keywordToken: string): boolean {
    if (sourceToken === keywordToken) {
      return true;
    }

    if (
      sourceToken.length >= 5 &&
      keywordToken.length >= 5 &&
      this.levenshteinDistance(sourceToken, keywordToken) <= 1
    ) {
      return true;
    }

    return (
      sourceToken.length >= 4 &&
      keywordToken.length >= 4 &&
      (sourceToken.includes(keywordToken) || keywordToken.includes(sourceToken))
    );
  }

  private getTokenVariants(token: string): string[] {
    const variants = new Set<string>([token]);

    for (const [rootToken, rootVariants] of Object.entries(
      PannesService.TOKEN_SYNONYMS,
    )) {
      if (token === rootToken || rootVariants.includes(token)) {
        variants.add(rootToken);
        for (const variant of rootVariants) {
          variants.add(variant);
        }
      }
    }

    return Array.from(variants);
  }

  private buildKeywordVariants(keyword: string): string[] {
    const tokens = this.tokenize(keyword);
    if (!tokens.length) {
      return [];
    }

    const tokenVariants = tokens.map((token) =>
      this.getTokenVariants(token).slice(0, 5),
    );

    const results = new Set<string>();
    const maxVariants = 24;

    const recurse = (index: number, current: string[]) => {
      if (results.size >= maxVariants) {
        return;
      }
      if (index === tokenVariants.length) {
        results.add(current.join(' '));
        return;
      }

      for (const variant of tokenVariants[index]) {
        recurse(index + 1, [...current, variant]);
        if (results.size >= maxVariants) {
          break;
        }
      }
    };

    recurse(0, []);
    return Array.from(results);
  }

  private scoreRuleMatch(
    descriptionNormalized: string,
    descriptionTokens: string[],
    keyword: string,
  ): number {
    const keywordVariants = this.buildKeywordVariants(keyword);
    if (!keywordVariants.length) {
      return 0;
    }

    let bestVariantScore = 0;
    const originalKeyword = this.normalizeText(keyword);

    for (const variant of keywordVariants) {
      const variantTokens = this.tokenize(variant);
      if (!variantTokens.length) {
        continue;
      }

      let score = 0;
      if (descriptionNormalized.includes(variant)) {
        score += 6;
      }

      let matchedTokens = 0;
      for (const keywordToken of variantTokens) {
        const exactMatch = descriptionTokens.some(
          (descriptionToken) => descriptionToken === keywordToken,
        );
        if (exactMatch) {
          score += 3;
          matchedTokens += 1;
          continue;
        }

        const fuzzyMatch = descriptionTokens.some((descriptionToken) =>
          this.tokenMatches(descriptionToken, keywordToken),
        );
        if (fuzzyMatch) {
          score += 2;
          matchedTokens += 1;
        }
      }

      if (matchedTokens === variantTokens.length) {
        score += 4;
      }

      if (variant !== originalKeyword && score > 0) {
        score += 1;
      }

      if (score > bestVariantScore) {
        bestVariantScore = score;
      }
    }

    return bestVariantScore;
  }

  async analyserDescription(description: string) {
    const descriptionNormalized = this.normalizeText(description);
    const descriptionTokens = this.tokenize(description);

    const activeRules = await this.chatbotRulesService.findActives();
    let bestRule: (typeof activeRules)[number] | null = null;
    let bestScore = 0;

    for (const rule of activeRules) {
      const score = this.scoreRuleMatch(
        descriptionNormalized,
        descriptionTokens,
        rule.mot_cle,
      );

      if (score > bestScore) {
        bestScore = score;
        bestRule = rule;
      }
    }

    if (bestRule && bestScore >= 5) {
      return {
        diagnostic: bestRule.diagnostic,
        gravite: bestRule.gravite,
        besoin_mecanicien: bestRule.besoin_prestataire,
        regle_utilisee: bestRule.mot_cle,
      };
    }

    return {
      diagnostic:
        'Diagnostic automatique non précis. Une vérification mécanique est recommandée.',
      gravite: 'Moyenne',
      besoin_mecanicien: true,
      regle_utilisee: null,
    };
  }

  async create(data: {
    user_id: number;
    marque: string;
    modele: string;
    annee: number;
    immatriculation: string;
    description: string;
    urgence: string;
  }) {
    const analyse = await this.analyserDescription(data.description);

    const panne = this.pannesRepository.create({
      ...data,
      statut: 'En attente',
      diagnostic: analyse.diagnostic,
      gravite: analyse.gravite,
      besoin_mecanicien: analyse.besoin_mecanicien,
    });

    return this.pannesRepository.save(panne);
  }

  findAll() {
    return this.pannesRepository.find({
      order: { id: 'DESC' },
    });
  }

  findByUser(userId: number) {
    return this.pannesRepository.find({
      where: { user_id: userId },
      order: { id: 'DESC' },
    });
  }
}