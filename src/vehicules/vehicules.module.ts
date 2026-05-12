import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiculesController } from './vehicules.controller';
import { VehiculesService } from './vehicules.service';
import { Vehicule } from './vehicule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicule])],
  controllers: [VehiculesController],
  providers: [VehiculesService],
  exports: [VehiculesService],
})
export class VehiculesModule {}