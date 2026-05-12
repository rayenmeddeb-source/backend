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
    rule.cout_min =
      data.cout_min !== undefined ? Number(data.cout_min) : null;
    rule.cout_max =
      data.cout_max !== undefined ? Number(data.cout_max) : null;
    rule.besoin_prestataire =
      data.besoin_prestataire !== undefined ? data.besoin_prestataire : true;
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
      message: `${rulesToCreate.length} règles importées, ${CHATBOT_RULE_PRESETS.length - rulesToCreate.length} déjà existantes.`,
    };
  }
}