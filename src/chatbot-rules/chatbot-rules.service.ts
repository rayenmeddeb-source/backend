import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChatbotRule } from './chatbot-rules.entity';
import { CHATBOT_RULE_PRESETS } from './chatbot-rule-presets';

@Injectable()
export class ChatbotRulesService {
  constructor(
    @InjectRepository(ChatbotRule)
    private readonly chatbotRulesRepository: Repository<ChatbotRule>,
  ) {}

  private normalizeText(text: string) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isAutomotiveMessage(message: string) {
    const text = this.normalizeText(message);

    const automotiveWords = [
      'voiture',
      'vehicule',
      'auto',
      'moteur',
      'pneu',
      'frein',
      'batterie',
      'demarre',
      'demarrage',
      'fumee',
      'huile',
      'essence',
      'diesel',
      'voyant',
      'volant',
      'embrayage',
      'boite',
      'vitesse',
      'clim',
      'radiateur',
      'chauffe',
      'carrosserie',
      'phare',
      'pare brise',
      'essuie glace',
      'turbo',
      'injecteur',
      'alternateur',
      'direction',
      'suspension',
      'echappement',
      'abs',
      'airbag',
      'joint de culasse',
      'liquide refroidissement',
      'carburant',
      'bougie',
      'courroie',
      'distribution',
      'amortisseur',
      'roue',
      'jante',
      'crevaison',
      'odeur essence',
      'diagnostic',
      'panne',
      'garage',
      'mecanicien',
      'electrique',
    ];

    return automotiveWords.some((word) => text.includes(word));
  }

  private getSeverityScore(gravite: string) {
    const g = this.normalizeText(gravite);

    if (
      g.includes('critique') ||
      g.includes('grave') ||
      g.includes('elevee')
    ) {
      return 90;
    }

    if (g.includes('moyenne') || g.includes('moderee')) {
      return 60;
    }

    if (g.includes('faible') || g.includes('legere')) {
      return 30;
    }

    return 50;
  }

  private extractSymptoms(message: string) {
    const text = this.normalizeText(message);

    const symptoms = [
      'bruit',
      'fumee',
      'chauffe',
      'demarre',
      'batterie',
      'frein',
      'pneu',
      'huile',
      'moteur',
      'voyant',
      'vibration',
      'odeur',
      'climatisation',
      'essence',
      'fuite',
      'direction',
      'embrayage',
      'boite',
      'alternateur',
      'radiateur',
      'turbo',
      'injecteur',
      'airbag',
      'abs',
      'phare',
      'essuie glace',
      'suspension',
      'echappement',
      'courroie',
      'joint de culasse',
    ];

    return symptoms.filter((symptom) => text.includes(symptom));
  }

  private calculateScore(message: string, rule: ChatbotRule) {
    const text = this.normalizeText(message);
    const keyword = this.normalizeText(rule.mot_cle);
    const diagnostic = this.normalizeText(rule.diagnostic);
    const categorie = this.normalizeText(rule.categorie || '');

    let score = 0;

    if (text.includes(keyword)) {
      score += 55;
    }

    const keywordWords = keyword.split(' ').filter((word) => word.length > 2);

    keywordWords.forEach((word) => {
      if (text.includes(word)) {
        score += 15;
      }
    });

    const diagnosticWords = diagnostic
      .split(' ')
      .filter((word) => word.length > 4);

    diagnosticWords.forEach((word) => {
      if (text.includes(word)) {
        score += 8;
      }
    });

    if (categorie && text.includes(categorie)) {
      score += 12;
    }

    return Math.min(score, 100);
  }

  async analyzeMessage(message: string) {
    if (!message || message.trim().length < 3) {
      throw new BadRequestException(
        'Veuillez décrire le problème du véhicule.',
      );
    }

    if (!this.isAutomotiveMessage(message)) {
      return {
        message:
          'Je suis spécialisé uniquement dans l’assistance automobile. Décrivez une panne ou un symptôme lié à votre véhicule.',
        diagnostic: 'Sujet hors domaine automobile',
        confidence: 0,
        gravite: 'Non applicable',
        conseil:
          'Veuillez saisir un problème automobile : moteur, batterie, freinage, pneus, voyant, fumée, bruit, odeur, démarrage, etc.',
        besoin_prestataire: false,
        categorie: 'Hors sujet',
        cout_estime: {
          min: null,
          max: null,
        },
        symptoms: [],
        matched_keyword: null,
        alternatives: [],
      };
    }

    const rules = await this.findActives();

    if (rules.length === 0) {
      return {
        message: 'Aucune règle active disponible.',
        diagnostic: 'Diagnostic indisponible',
        confidence: 0,
        gravite: 'Inconnue',
        conseil:
          'Veuillez contacter un prestataire automobile pour un diagnostic manuel.',
        besoin_prestataire: true,
        categorie: 'Diagnostic général',
        cout_estime: {
          min: null,
          max: null,
        },
        symptoms: [],
        matched_keyword: null,
        alternatives: [],
      };
    }

    const results = rules
      .map((rule) => ({
        rule,
        score: this.calculateScore(message, rule),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const symptoms = this.extractSymptoms(message);

    if (results.length === 0) {
      return {
        message:
          'Votre message semble automobile, mais je n’ai pas trouvé de panne précise.',
        diagnostic: 'Panne non identifiée',
        confidence: 30,
        gravite: 'Moyenne',
        conseil:
          'Ajoutez plus de détails : bruit, fumée, voyant, odeur, moment du problème, démarrage, freinage ou comportement du véhicule.',
        besoin_prestataire: true,
        categorie: 'Diagnostic général',
        cout_estime: {
          min: null,
          max: null,
        },
        symptoms,
        matched_keyword: null,
        alternatives: [],
      };
    }

    const best = results[0].rule;
    const confidence = results[0].score;
    const severityScore = this.getSeverityScore(best.gravite);

    let conseil = 'Nous vous recommandons de consulter un prestataire.';

    if (severityScore >= 80) {
      conseil =
        'Arrêtez le véhicule si nécessaire et contactez rapidement un prestataire qualifié.';
    } else if (severityScore >= 50) {
      conseil =
        'Le problème doit être vérifié prochainement afin d’éviter une panne plus grave.';
    } else {
      conseil =
        'Le problème semble moins urgent, mais une vérification reste recommandée.';
    }

    return {
      message: 'Analyse NLP effectuée avec succès.',
      diagnostic: best.diagnostic,
      confidence,
      gravite: best.gravite,
      conseil,
      besoin_prestataire: best.besoin_prestataire,
      categorie: best.categorie || 'Diagnostic général',
      cout_estime: {
        min: best.cout_min,
        max: best.cout_max,
      },
      symptoms,
      matched_keyword: best.mot_cle,
      alternatives: results.slice(1, 4).map((item) => ({
        diagnostic: item.rule.diagnostic,
        confidence: item.score,
        gravite: item.rule.gravite,
        categorie: item.rule.categorie,
      })),
    };
  }

  async create(data: {
    mot_cle: string;
    diagnostic: string;
    gravite: string;
    cout_min?: number;
    cout_max?: number;
    besoin_prestataire?: boolean;
    categorie?: string;
    actif?: boolean;
  }) {
    const existingRule = await this.chatbotRulesRepository.findOne({
      where: { mot_cle: data.mot_cle },
    });

    if (existingRule) {
      throw new BadRequestException('Ce mot-clé existe déjà.');
    }

    const rule = new ChatbotRule();

    rule.mot_cle = data.mot_cle;
    rule.diagnostic = data.diagnostic;
    rule.gravite = data.gravite;
    rule.cout_min = data.cout_min !== undefined ? Number(data.cout_min) : null;
    rule.cout_max = data.cout_max !== undefined ? Number(data.cout_max) : null;
    rule.besoin_prestataire =
      data.besoin_prestataire !== undefined
        ? data.besoin_prestataire
        : true;
    rule.categorie = data.categorie ?? null;
    rule.actif = data.actif !== undefined ? data.actif : true;

    return this.chatbotRulesRepository.save(rule);
  }

  findAll() {
    return this.chatbotRulesRepository.find({
      order: { id: 'DESC' },
    });
  }

  findActives() {
    return this.chatbotRulesRepository.find({
      where: { actif: true },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const rule = await this.chatbotRulesRepository.findOne({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException('Règle introuvable.');
    }

    return rule;
  }

  async update(
    id: number,
    data: {
      mot_cle?: string;
      diagnostic?: string;
      gravite?: string;
      cout_min?: number;
      cout_max?: number;
      besoin_prestataire?: boolean;
      categorie?: string;
      actif?: boolean;
    },
  ) {
    const rule = await this.findOne(id);

    if (data.mot_cle && data.mot_cle !== rule.mot_cle) {
      const existingRule = await this.chatbotRulesRepository.findOne({
        where: { mot_cle: data.mot_cle },
      });

      if (existingRule) {
        throw new BadRequestException('Ce mot-clé existe déjà.');
      }
    }

    if (data.mot_cle !== undefined) {
      rule.mot_cle = data.mot_cle;
    }

    if (data.diagnostic !== undefined) {
      rule.diagnostic = data.diagnostic;
    }

    if (data.gravite !== undefined) {
      rule.gravite = data.gravite;
    }

    if (data.cout_min !== undefined) {
      rule.cout_min = Number(data.cout_min);
    }

    if (data.cout_max !== undefined) {
      rule.cout_max = Number(data.cout_max);
    }

    if (data.besoin_prestataire !== undefined) {
      rule.besoin_prestataire = data.besoin_prestataire;
    }

    if (data.categorie !== undefined) {
      rule.categorie = data.categorie;
    }

    if (data.actif !== undefined) {
      rule.actif = data.actif;
    }

    return this.chatbotRulesRepository.save(rule);
  }

  async remove(id: number) {
    const rule = await this.findOne(id);

    await this.chatbotRulesRepository.remove(rule);

    return {
      message: 'Règle supprimée avec succès.',
    };
  }

  async importPresets() {
    const presetKeywords = CHATBOT_RULE_PRESETS.map((preset) => preset.mot_cle);

    const existingRules = await this.chatbotRulesRepository.find({
      where: { mot_cle: In(presetKeywords) },
      select: ['mot_cle'],
    });

    const existingSet = new Set(existingRules.map((rule) => rule.mot_cle));

    const rulesToCreate = CHATBOT_RULE_PRESETS.filter(
      (preset) => !existingSet.has(preset.mot_cle),
    ).map((preset) => this.chatbotRulesRepository.create(preset));

    if (rulesToCreate.length > 0) {
      await this.chatbotRulesRepository.save(rulesToCreate);
    }

    return {
      total_presets: CHATBOT_RULE_PRESETS.length,
      imported: rulesToCreate.length,
      skipped_existing: CHATBOT_RULE_PRESETS.length - rulesToCreate.length,
      message: `${rulesToCreate.length} règles importées, ${
        CHATBOT_RULE_PRESETS.length - rulesToCreate.length
      } déjà existantes.`,
    };
  }
}