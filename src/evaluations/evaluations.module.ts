import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evaluation } from './evaluation.entity';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';
import { RendezVous } from '../rendez-vous/rendez-vous.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Evaluation, RendezVous])],
  providers: [EvaluationsService],
  controllers: [EvaluationsController],
})
export class EvaluationsModule {}