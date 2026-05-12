import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { Admin } from './admin.entity';
import { UsersModule } from '../users/users.module';
import { SuperAdminsModule } from '../super-admins/super-admins.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    UsersModule,
    SuperAdminsModule,
  ],
  controllers: [AdminsController],
  providers: [AdminsService],
  exports: [AdminsService],
})
export class AdminsModule {}