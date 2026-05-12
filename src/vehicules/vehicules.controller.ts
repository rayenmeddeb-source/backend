import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { VehiculesService } from './vehicules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user.interface';

@Controller('vehicules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiculesController {
  constructor(private readonly vehiculesService: VehiculesService) {}

  @Post()
  @Roles('client')
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      client_id: number;
      marque: string;
      modele: string;
      annee: number;
      immatriculation: string;
      carburant?: string;
    },
  ) {
    if (user.sub !== Number(body.client_id)) {
      throw new ForbiddenException('Vous ne pouvez créer que vos propres véhicules.');
    }

    return this.vehiculesService.create(body);
  }

  @Get()
  @Roles('administrateur', 'prestataire')
  findAll() {
    return this.vehiculesService.findAll();
  }

  @Get('client/:id')
  @Roles('client', 'administrateur')
  findByClient(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const clientId = Number(id);

    if (user.type === 'client' && user.sub !== clientId) {
      throw new ForbiddenException('Accès interdit à ces véhicules.');
    }

    return this.vehiculesService.findByClient(clientId);
  }

  @Get(':id')
  @Roles('client', 'administrateur', 'prestataire')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const vehicule = await this.vehiculesService.findOne(Number(id));

    if (user.type === 'client' && vehicule.client_id !== user.sub) {
      throw new ForbiddenException('Accès interdit à ce véhicule.');
    }

    return vehicule;
  }

  @Put(':id')
  @Roles('client', 'administrateur')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      marque?: string;
      modele?: string;
      annee?: number;
      immatriculation?: string;
      carburant?: string;
    },
  ) {
    const vehicule = await this.vehiculesService.findOne(Number(id));

    if (user.type === 'client' && vehicule.client_id !== user.sub) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos véhicules.');
    }

    return this.vehiculesService.update(Number(id), body);
  }

  @Delete(':id')
  @Roles('client', 'administrateur')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const vehicule = await this.vehiculesService.findOne(Number(id));

    if (user.type === 'client' && vehicule.client_id !== user.sub) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos véhicules.');
    }

    return this.vehiculesService.remove(Number(id));
  }
}