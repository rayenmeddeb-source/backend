import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

import { UsersService } from '../users/users.service';
import { AdminsService } from '../admins/admins.service';
import { SuperAdminsService } from '../super-admins/super-admins.service';
import { UserRole } from './auth-user.interface';

type AuthUser = {
  id: number;
  nom: string;
  email: string;
  prenom?: string;
  specialite?: string;
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
        prenom: user.prenom,
        email: user.email,
        type,
        specialite: user.specialite || null,
      },
    };
  }

  private generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendVerificationEmail(email: string, code: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"AssistAuto" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Code de vérification AssistAuto',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Bienvenue sur AssistAuto</h2>
          <p>Votre code de vérification est :</p>
          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #2563eb;
            margin: 20px 0;
          ">
            ${code}
          </div>
          <p>Après vérification, votre compte sera en attente de validation par l’administrateur.</p>
        </div>
      `,
    });
  }

  async signup(nom: string, email: string, password: string, prenom?: string) {
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

    const client = await this.usersService.create(
      nom,
      email,
      hashedPassword,
      prenom,
    );

    const verificationCode = this.generateVerificationCode();

    await this.usersService.updateVerificationCode(client.id, verificationCode);
    await this.sendVerificationEmail(email, verificationCode);

    return {
      message:
        'Compte créé avec succès. Un code de vérification a été envoyé par email.',
      email,
    };
  }

  async verifyEmail(email: string, code: string) {
    const client = await this.usersService.findByEmail(email);

    if (!client) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    if (client.email_verified) {
      return {
        message: 'Email déjà vérifié.',
      };
    }

    if (client.verification_code !== code) {
      throw new UnauthorizedException('Code de vérification invalide.');
    }

    await this.usersService.verifyEmail(client.id);

    return {
      message:
        'Email vérifié avec succès. Votre compte est maintenant en attente de validation par l’administrateur.',
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

      if (!client.email_verified) {
        throw new UnauthorizedException(
          'Veuillez vérifier votre adresse email avant de vous connecter.',
        );
      }

      if (client.status !== 'ACCEPTE') {
        throw new UnauthorizedException(
          'Votre compte est en attente de validation par l’administrateur.',
        );
      }

      return this.buildAuthResponse(client, 'client');
    }

    throw new UnauthorizedException('Email introuvable.');
  }
}