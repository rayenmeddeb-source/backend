import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Client introuvable.');
    }

    return user;
  }

  async create(
    nom: string,
    email: string,
    password: string,
    prenom?: string,
  ): Promise<User> {
    const existingUser = await this.findByEmail(email);

    if (existingUser) {
      throw new BadRequestException('Ce client existe déjà.');
    }

    const user = this.usersRepository.create({
      nom,
      prenom: prenom || '',
      email,
      password,
    });

    return this.usersRepository.save(user);
  }

  async updatePassword(id: number, password: string) {
    await this.usersRepository.update({ id }, { password });
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);

    return {
      message: 'Client supprimé avec succès.',
    };
  }
}