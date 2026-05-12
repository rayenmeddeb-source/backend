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
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user.interface';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('prestataire')
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      prestataire_id: number;
      titre: string;
      description?: string;
      categorie: string;
      prix_min?: number;
      prix_max?: number;
    },
  ) {
    if (user.sub !== Number(body.prestataire_id)) {
      throw new ForbiddenException('Vous ne pouvez créer que vos propres services.');
    }

    return this.servicesService.create(body);
  }

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Get('prestataire/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('prestataire', 'administrateur')
  findByPrestataire(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const prestataireId = Number(id);

    if (user.type === 'prestataire' && user.sub !== prestataireId) {
      throw new ForbiddenException('Accès interdit à ces services.');
    }

    return this.servicesService.findByPrestataire(Number(id));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(Number(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('prestataire', 'administrateur')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      titre?: string;
      description?: string;
      categorie?: string;
      prix_min?: number;
      prix_max?: number;
    },
  ) {
    const service = await this.servicesService.findOne(Number(id));

    if (user.type === 'prestataire' && service.prestataire_id !== user.sub) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos services.');
    }

    return this.servicesService.update(Number(id), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('prestataire', 'administrateur')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const service = await this.servicesService.findOne(Number(id));

    if (user.type === 'prestataire' && service.prestataire_id !== user.sub) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos services.');
    }

    return this.servicesService.remove(Number(id));
  }
}