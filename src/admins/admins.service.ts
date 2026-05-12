import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminsRepository: Repository<Admin>,
  ) {}

  findByEmail(email: string) {
    return this.adminsRepository.findOne({ where: { email } });
  }

  findAll() {
    return this.adminsRepository.find({
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const admin = await this.adminsRepository.findOne({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Prestataire introuvable.');
    }

    return admin;
  }

  async create(
    nom: string,
    email: string,
    password: string,
    specialite: string,
  ) {
    const existingAdmin = await this.findByEmail(email);

    if (existingAdmin) {
      throw new BadRequestException('Ce prestataire existe déjà.');
    }

    const admin = this.adminsRepository.create({
      nom,
      email,
      password,
      specialite,
    });

    return this.adminsRepository.save(admin);
  }

  async updatePassword(id: number, password: string) {
    await this.adminsRepository.update({ id }, { password });
  }

  async remove(id: number) {
    const admin = await this.findOne(id);
    await this.adminsRepository.remove(admin);

    return {
      message: 'Prestataire supprimé avec succès.',
    };
  }
}