import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ChatbotHistoryService } from './chatbot-history.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('chatbot-history')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatbotHistoryController {
  constructor(private readonly service: ChatbotHistoryService) {}

  @Get()
  @Roles('administrateur')
  findAll() {
    return this.service.findAll();
  }

  @Get('client/:id')
  @Roles('administrateur')
  findByClient(@Param('id') id: string) {
    return this.service.findByClient(Number(id));
  }
}