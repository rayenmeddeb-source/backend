import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AdminsService } from '../admins/admins.service';
import { SuperAdminsService } from '../super-admins/super-admins.service';
import { UserRole } from './auth-user.interface';

type AuthUser = {
  id: number;
  nom: string;
  email: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminsService: AdminsService,
    private readonly superAdminsService: SuperAdminsService,
    private readonly jwtService: JwtService,
  ) {}

  private isPasswordHashed(password: string) {
    return (
      password.startsWith('$2a$') ||
      password.startsWith('$2b$') ||
      password.startsWith('$2y$')
    );
  }

  private async verifyAndMigratePassword(
    storedPassword: string,
    providedPassword: string,
    role: UserRole,
    userId: number,
  ) {
    if (this.isPasswordHashed(storedPassword)) {
      return bcrypt.compare(providedPassword, storedPassword);
    }

    if (storedPassword !== providedPassword) {
      return false;
    }

    const hashedPassword = await bcrypt.hash(providedPassword, 10);

    if (role === 'client') {
      await this.usersService.updatePassword(userId, hashedPassword);
    } else if (role === 'prestataire') {
      await this.adminsService.updatePassword(userId, hashedPassword);
    } else {
      await this.superAdminsService.updatePassword(userId, hashedPassword);
    }

    return true;
  }

  private buildAuthResponse(user: AuthUser, type: UserRole) {
    const payload = {
      sub: user.id,
      email: user.email,
      type,
    };

    return {
      message: 'Connexion réussie.',
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        type,
      },
    };
  }

  async signup(nom: string, email: string, password: string) {
    const existingAdministrateur =
      await this.superAdminsService.findByEmail(email);

    if (existingAdministrateur) {
      throw new BadRequestException(
        'Cet email est réservé à un administrateur.',
      );
    }

    const existingPrestataire = await this.adminsService.findByEmail(email);

    if (existingPrestataire) {
      throw new BadRequestException(
        'Cet email est réservé à un prestataire.',
      );
    }

    const existingClient = await this.usersService.findByEmail(email);

    if (existingClient) {
      throw new BadRequestException('Ce client existe déjà.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const client = await this.usersService.create(nom, email, hashedPassword);

    return {
      message: 'Compte client créé avec succès.',
      accessToken: this.jwtService.sign({
        sub: client.id,
        email: client.email,
        type: 'client',
      }),
      user: {
        id: client.id,
        nom: client.nom,
        email: client.email,
        type: 'client',
      },
    };
  }

  async login(email: string, password: string) {
    const administrateur = await this.superAdminsService.findByEmail(email);

    if (administrateur) {
      const isValidPassword = await this.verifyAndMigratePassword(
        administrateur.password,
        password,
        'administrateur',
        administrateur.id,
      );

      if (!isValidPassword) {
        throw new UnauthorizedException('Mot de passe incorrect.');
      }

      return this.buildAuthResponse(administrateur, 'administrateur');
    }

    const prestataire = await this.adminsService.findByEmail(email);

    if (prestataire) {
      const isValidPassword = await this.verifyAndMigratePassword(
        prestataire.password,
        password,
        'prestataire',
        prestataire.id,
      );

      if (!isValidPassword) {
        throw new UnauthorizedException('Mot de passe incorrect.');
      }

      return this.buildAuthResponse(prestataire, 'prestataire');
    }

    const client = await this.usersService.findByEmail(email);

    if (client) {
      const isValidPassword = await this.verifyAndMigratePassword(
        client.password,
        password,
        'client',
        client.id,
      );

      if (!isValidPassword) {
        throw new UnauthorizedException('Mot de passe incorrect.');
      }

      return this.buildAuthResponse(client, 'client');
    }

    throw new UnauthorizedException('Email introuvable.');
  }
}