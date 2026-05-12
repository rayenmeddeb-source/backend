import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reclamation } from './reclamation.entity';
import { ReclamationsService } from './reclamations.service';
import { ReclamationsController } from './reclamations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reclamation])],
  controllers: [ReclamationsController],
  providers: [ReclamationsService],
  exports: [ReclamationsService],
})
export class ReclamationsModule {}