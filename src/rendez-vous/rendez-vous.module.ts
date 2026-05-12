import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RendezVous } from './rendez-vous.entity';
import { RendezVousService } from './rendez-vous.service';
import { RendezVousController } from './rendez-vous.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RendezVous])],
  providers: [RendezVousService],
  controllers: [RendezVousController],
})
export class RendezVousModule {}