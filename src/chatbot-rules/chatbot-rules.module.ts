import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotRulesController } from './chatbot-rules.controller';
import { ChatbotRulesService } from './chatbot-rules.service';
import { ChatbotRule } from './chatbot-rules.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatbotRule])],
  controllers: [ChatbotRulesController],
  providers: [ChatbotRulesService],
  exports: [ChatbotRulesService],
})
export class ChatbotRulesModule {}