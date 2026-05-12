import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AdminsService } from './admins.service';
import { UsersService } from '../users/users.service';
import { SuperAdminsService } from '../super-admins/super-admins.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminsController {
  constructor(
    private readonly adminsService: AdminsService,
    private readonly usersService: UsersService,
    private readonly superAdminsService: SuperAdminsService,
  ) {}

  @Get('prestataires')
  @Roles('administrateur', 'client')
  findAllPrestataires() {
    return this.adminsService.findAll();
  }

  @Get('prestataires/:id')
  @Roles('administrateur', 'client')
  findOnePrestataire(@Param('id') id: string) {
    return this.adminsService.findOne(Number(id));
  }

  @Post('prestataires')
  @Roles('administrateur')
  async createPrestataire(
    @Body()
    body: {
      nom: string;
      email: string;
      password: string;
      specialite: string;
    },
  ) {
    const existingSuperAdmin = await this.superAdminsService.findByEmail(
      body.email,
    );

    if (existingSuperAdmin) {
      throw new Error('Cet email est réservé à un administrateur.');
    }

    const existingClient = await this.usersService.findByEmail(body.email);

    if (existingClient) {
      throw new Error('Cet email est déjà utilisé par un client.');
    }

    const existingPrestataire = await this.adminsService.findByEmail(body.email);

    if (existingPrestataire) {
      throw new Error('Ce prestataire existe déjà.');
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    return this.adminsService.create(
      body.nom,
      body.email,
      hashedPassword,
      body.specialite,
    );
  }

  @Delete('prestataires/:id')
  @Roles('administrateur')
  deletePrestataire(@Param('id') id: string) {
    return this.adminsService.remove(Number(id));
  }

  @Get('clients')
  @Roles('administrateur')
  findAllClients() {
    return this.usersService.findAll();
  }

  @Get('clients/:id')
  @Roles('administrateur')
  findOneClient(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }

  @Post('clients')
  @Roles('administrateur')
  async createClient(
    @Body() body: { nom: string; email: string; password: string },
  ) {
    const existingSuperAdmin = await this.superAdminsService.findByEmail(
      body.email,
    );

    if (existingSuperAdmin) {
      throw new Error('Cet email est réservé à un administrateur.');
    }

    const existingPrestataire = await this.adminsService.findByEmail(body.email);

    if (existingPrestataire) {
      throw new Error('Cet email est déjà utilisé par un prestataire.');
    }

    const existingClient = await this.usersService.findByEmail(body.email);

    if (existingClient) {
      throw new Error('Ce client existe déjà.');
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    return this.usersService.create(body.nom, body.email, hashedPassword);
  }

  @Delete('clients/:id')
  @Roles('administrateur')
  deleteClient(@Param('id') id: string) {
    return this.usersService.remove(Number(id));
  }
}