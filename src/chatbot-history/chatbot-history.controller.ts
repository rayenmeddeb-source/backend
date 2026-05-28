import { Controller, Get, UseGuards } from '@nestjs/common';
import { ChatbotHistoryService } from './chatbot-history.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('chatbot-history')
export class ChatbotHistoryController {
  constructor(
    private readonly chatbotHistoryService: ChatbotHistoryService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrateur')
  findAll() {
    return this.chatbotHistoryService.findAll();
  }
}