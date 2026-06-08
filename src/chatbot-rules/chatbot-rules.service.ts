import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import axios from 'axios';

import { ChatbotRule } from './chatbot-rules.entity';
import { CHATBOT_RULE_PRESETS } from './chatbot-rule-presets';
import { ChatbotHistoryService } from '../chatbot-history/chatbot-history.service';

@Injectable()
export class ChatbotRulesService {
  constructor(
    @InjectRepository(ChatbotRule)
    private readonly chatbotRulesRepository: Repository<ChatbotRule>,

    private readonly chatbotHistoryService: ChatbotHistoryService,
  ) {}

  private normalize(text: string) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private greetings = ['bonjour', 'salut', 'hello', 'bonsoir', 'hey', 'cc', 'salam'];

  private faqResponses = [
    {
      keywords: ['prendre rendez vous', 'rendez vous', 'reservation', 'reserver'],
      response:
        'Vous pouvez prendre un rendez-vous depuis votre espace client, dans la section Rendez-vous.',
    },
    {
      keywords: ['combien coute', 'prix', 'tarif', 'cout'],
      response:
        'Le coût dépend de la panne et du prestataire. Je peux vous donner une estimation après description du problème.',
    },
    {
      keywords: ['est ce dangereux', 'dangereux', 'risque'],
      response:
        'Certaines pannes peuvent être dangereuses. Si vous constatez fumée, surchauffe, freinage faible ou voyant rouge, arrêtez le véhicule et contactez un prestataire.',
    },
    {
      keywords: ['quel prestataire', 'quel garage', 'qui contacter'],
      response:
        'Selon la panne, je peux vous orienter vers un mécanicien, un électricien auto, un tôlier, un spécialiste freinage, pneus ou climatisation.',
    },
    {
      keywords: ['merci', 'thanks'],
      response:
        'Avec plaisir 👋 Décrivez-moi un autre symptôme si vous souhaitez un autre diagnostic.',
    },
  ];

  private isAutomotiveMessage(message: string) {
    const text = this.normalize(message);

    const words = [
      'voiture',
      'vehicule',
      'auto',
      'moteur',
      'panne',
      'garage',
      'batterie',
      'demarre',
      'demarrage',
      'fumee',
      'huile',
      'essence',
      'diesel',
      'voyant',
      'frein',
      'pneu',
      'volant',
      'direction',
      'embrayage',
      'boite',
      'vitesse',
      'clim',
      'radiateur',
      'chauffe',
      'carrosserie',
      'phare',
      'turbo',
      'injecteur',
      'alternateur',
      'suspension',
      'echappement',
      'abs',
      'airbag',
      'courroie',
      'distribution',
      'bruit',
      'vibration',
      'tremble',
      'fuite',
      'odeur',
      'refroidissement',
      'electrique',
      'accelerer',
      'acceleration',
      'consommation',
    ];

    return words.some((word) => text.includes(word));
  }

  private extractSymptoms(message: string) {
    const text = this.normalize(message);

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
      'tremblement',
      'odeur',
      'clim',
      'essence',
      'fuite',
      'direction',
      'volant',
      'embrayage',
      'boite',
      'alternateur',
      'radiateur',
      'turbo',
      'injecteur',
      'airbag',
      'abs',
      'phare',
      'suspension',
      'echappement',
      'courroie',
      'distribution',
      'acceleration',
      'consommation',
    ];

    return symptoms.filter((symptom) => text.includes(symptom));
  }

  private severityScore(gravite: string) {
    const g = this.normalize(gravite);

    if (g.includes('elevee') || g.includes('grave') || g.includes('critique')) {
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

  private calculateScore(message: string, rule: ChatbotRule) {
    const text = this.normalize(message);
    const keyword = this.normalize(rule.mot_cle);
    const diagnostic = this.normalize(rule.diagnostic);
    const categorie = this.normalize(rule.categorie || '');

    let score = 0;

    if (text.includes(keyword)) score += 65;

    keyword.split(' ').forEach((word) => {
      if (word.length > 2 && text.includes(word)) score += 18;
    });

    diagnostic.split(' ').forEach((word) => {
      if (word.length > 4 && text.includes(word)) score += 8;
    });

    if (categorie && text.includes(categorie)) score += 10;

    return Math.min(score, 100);
  }

  private async askOllama(prompt: string) {
    try {
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'gemma2:2b',
        prompt: `
Tu es un assistant automobile intelligent.


Tu réponds UNIQUEMENT aux problèmes de voitures.

Tu ne dois jamais parler de sécurité informatique, vélos, systèmes d'alarme ou sujets hors automobile.


Question utilisateur :
"${prompt}"

Réponds toujours exactement avec ce format :

🔍 Diagnostic probable :
...

⚠️ Gravité :
...

💡 Conseil :
...

🚗 Peut rouler ?
...

👨‍🔧 Prestataire recommandé :
...

Réponse courte, professionnelle et précise.
        `,
        stream: false,
      });

      return response.data.response;
    } catch (error) {
      console.error('Erreur Ollama:', error);
      return null;
    }
  }

  private async saveHistory(
    client_id: number,
    message_client: string,
    response: any,
  ) {
    if (!client_id) return;

    await this.chatbotHistoryService.create({
      client_id,
      message_client,
      reponse_bot: response.conseil || response.message || '',
      diagnostic: response.diagnostic || null,
      confidence: response.confidence || 0,
    });
  }

  async analyzeMessage(client_id: number, message: string) {
    if (!message || message.trim().length < 2) {
      throw new BadRequestException(
        'Veuillez décrire votre panne ou votre question.',
      );
    }

    const text = this.normalize(message);

    if (this.greetings.includes(text)) {
      const response = {
        message:
          'Bonjour 👋 Je suis votre assistant automobile intelligent. Décrivez une panne ou posez une question sur votre véhicule.',
       
      };

      await this.saveHistory(client_id, message, response);
      return response;
    }

    const faq = this.faqResponses.find((item) =>
      item.keywords.some((keyword) => text.includes(this.normalize(keyword))),
    );

    if (faq) {
      const response = {
        message: 'Réponse à votre question.',
        diagnostic: 'Question générale',
        confidence: 100,
        gravite: 'Non applicable',
        conseil: faq.response,
        besoin_prestataire: false,
        categorie: 'FAQ',
        cout_estime: { min: null, max: null },
        symptoms: [],
        matched_keyword: null,
        alternatives: [],
      };

      await this.saveHistory(client_id, message, response);
      return response;
    }

    if (!this.isAutomotiveMessage(message)) {
      const response = {
        message: 'Je suis spécialisé dans l’assistance automobile.',
        diagnostic: 'Message hors sujet',
      };

      await this.saveHistory(client_id, message, response);
      return response;
    }

    const rules = await this.findActives();

    if (rules.length === 0) {
      const aiResponse = await this.askOllama(message);

      const response = {
        message: 'Analyse IA avancée.',
        diagnostic: 'Analyse IA',
        confidence: 75,
        gravite: 'Moyenne',
        conseil:
          aiResponse ||
          'Je n’ai pas identifié précisément la panne. Veuillez contacter un prestataire.',
        besoin_prestataire: true,
        categorie: 'IA Automobile',
        cout_estime: { min: null, max: null },
        symptoms: this.extractSymptoms(message),
        matched_keyword: null,
        alternatives: [],
      };

      await this.saveHistory(client_id, message, response);
      return response;
    }

    const results = rules
      .map((rule) => ({
        rule,
        score: this.calculateScore(message, rule),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const symptoms = this.extractSymptoms(message);

    if (results.length === 0 || results[0].score < 30) {
      const aiResponse = await this.askOllama(message);

      const response = {
        message: 'Analyse IA avancée.',
        diagnostic: 'Analyse IA',
        confidence: 75,
        gravite: 'Moyenne',
        conseil:
          aiResponse ||
          'Je n’ai pas identifié précisément cette panne. Veuillez préciser les symptômes.',
        besoin_prestataire: true,
        categorie: 'IA Automobile',
        cout_estime: { min: null, max: null },
        symptoms,
        matched_keyword: results[0]?.rule?.mot_cle || null,
        alternatives: [],
      };

      await this.saveHistory(client_id, message, response);
      return response;
    }

    const best = results[0].rule;
    const confidence = results[0].score;
    const severity = this.severityScore(best.gravite);

    let conseil = 'Un contrôle chez un prestataire est recommandé.';

    if (severity >= 80) {
      conseil =
        'Panne potentiellement sérieuse. Évitez de rouler si le symptôme est important et contactez rapidement un prestataire.';
    } else if (severity >= 50) {
      conseil =
        'Le problème doit être vérifié prochainement afin d’éviter une panne plus grave.';
    } else {
      conseil =
        'Le problème semble moins urgent, mais une vérification reste conseillée.';
    }

    const response = {
      message: 'Analyse effectuée avec succès.',
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

    await this.saveHistory(client_id, message, response);
    return response;
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

    const rule = this.chatbotRulesRepository.create({
      mot_cle: data.mot_cle,
      diagnostic: data.diagnostic,
      gravite: data.gravite,
      cout_min: data.cout_min !== undefined ? Number(data.cout_min) : null,
      cout_max: data.cout_max !== undefined ? Number(data.cout_max) : null,
      besoin_prestataire:
        data.besoin_prestataire !== undefined ? data.besoin_prestataire : true,
      categorie: data.categorie ?? null,
      actif: data.actif !== undefined ? data.actif : true,
    });

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

  async update(id: number, data: Partial<ChatbotRule>) {
    const rule = await this.findOne(id);
    Object.assign(rule, data);
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