import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatbotHistory } from './chatbot-history.entity';
import { ChatbotHistoryService } from './chatbot-history.service';
import { ChatbotHistoryController } from './chatbot-history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChatbotHistory])],
  controllers: [ChatbotHistoryController],
  providers: [ChatbotHistoryService],
  exports: [ChatbotHistoryService],
})
export class ChatbotHistoryModule {}