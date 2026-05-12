import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminsService } from './super-admins.service';
import { SuperAdmin } from './super-admin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SuperAdmin])],
  providers: [SuperAdminsService],
  exports: [SuperAdminsService],
})
export class SuperAdminsModule {}