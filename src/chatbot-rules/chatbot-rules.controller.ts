import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ChatbotRulesService } from './chatbot-rules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('chatbot-rules')
export class ChatbotRulesController {
  constructor(private readonly chatbotRulesService: ChatbotRulesService) {}

  @Post('analyze')
  analyze(@Body() body: { message: string }) {
    return this.chatbotRulesService.analyzeMessage(body.message);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrateur')
  create(
    @Body()
    body: {
      mot_cle: string;
      diagnostic: string;
      gravite: string;
      cout_min?: number;
      cout_max?: number;
      besoin_prestataire?: boolean;
      categorie?: string;
      actif?: boolean;
    },
  ) {
    return this.chatbotRulesService.create(body);
  }

  @Post('import-presets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrateur')
  importPresets() {
    return this.chatbotRulesService.importPresets();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrateur')
  findAll() {
    return this.chatbotRulesService.findAll();
  }

  @Get('actives')
  findActives() {
    return this.chatbotRulesService.findActives();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrateur')
  findOne(@Param('id') id: string) {
    return this.chatbotRulesService.findOne(Number(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrateur')
  update(
    @Param('id') id: string,
    @Body()
    body: {
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
    return this.chatbotRulesService.update(Number(id), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrateur')
  remove(@Param('id') id: string) {
    return this.chatbotRulesService.remove(Number(id));
  }
}