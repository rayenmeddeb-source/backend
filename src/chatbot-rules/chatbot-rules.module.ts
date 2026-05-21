import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatbotRule } from './chatbot-rules.entity';
import { ChatbotRulesController } from './chatbot-rules.controller';
import { ChatbotRulesService } from './chatbot-rules.service';

import { ChatbotHistoryModule } from '../chatbot-history/chatbot-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatbotRule]),
    ChatbotHistoryModule,
  ],
  controllers: [ChatbotRulesController],
  providers: [ChatbotRulesService],
  exports: [ChatbotRulesService],
})
export class ChatbotRulesModule {}