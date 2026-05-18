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

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { id: 'DESC' },
    });
  }

  async findPendingUsers(): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.status = :status', { status: 'EN_ATTENTE' })
      .orderBy('user.id', 'DESC')
      .getMany();
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
      status: 'EN_ATTENTE',
      email_verified: false,
      verification_code: '',
    });

    return this.usersRepository.save(user);
  }

  async updateVerificationCode(id: number, code: string) {
    await this.usersRepository.update(
      { id },
      {
        verification_code: code,
        email_verified: false,
      },
    );
  }

  async verifyEmail(id: number) {
    await this.usersRepository.update(
      { id },
      {
        email_verified: true,
        verification_code: '',
      },
    );
  }

  async acceptUser(id: number) {
    const user = await this.findOne(id);

    user.status = 'ACCEPTE';

    const savedUser = await this.usersRepository.save(user);

    return {
      message: 'Compte client accepté avec succès.',
      user: savedUser,
    };
  }

  async refuseUser(id: number) {
    const user = await this.findOne(id);

    user.status = 'REFUSE';

    const savedUser = await this.usersRepository.save(user);

    return {
      message: 'Compte client refusé avec succès.',
      user: savedUser,
    };
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