import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PannesController } from './pannes.controller';
import { PannesService } from './pannes.service';
import { Panne } from './panne.entity';
import { ChatbotRulesModule } from '../chatbot-rules/chatbot-rules.module';

@Module({
  imports: [TypeOrmModule.forFeature([Panne]), ChatbotRulesModule],
  controllers: [PannesController],
  providers: [PannesService],
  exports: [PannesService],
})
export class PannesModule {}