import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuperAdmin } from './super-admin.entity';

@Injectable()
export class SuperAdminsService {
  constructor(
    @InjectRepository(SuperAdmin)
    private readonly superAdminsRepository: Repository<SuperAdmin>,
  ) {}

  findByEmail(email: string) {
    return this.superAdminsRepository.findOne({ where: { email } });
  }

  async updatePassword(id: number, password: string) {
    await this.superAdminsRepository.update({ id }, { password });
  }
}