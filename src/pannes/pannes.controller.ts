import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PannesService } from './pannes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user.interface';

@Controller('pannes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PannesController {
  constructor(private readonly pannesService: PannesService) {}

  @Post('analyser')
  @Roles('client')
  analyserDescription(
    @Body()
    body: {
      description: string;
    },
  ) {
    return this.pannesService.analyserDescription(body.description || '');
  }

  @Post()
  @Roles('client')
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      user_id: number;
      marque: string;
      modele: string;
      annee: number;
      immatriculation: string;
      description: string;
      urgence: string;
    },
  ) {
    if (user.sub !== Number(body.user_id)) {
      throw new ForbiddenException('Vous ne pouvez déclarer que vos propres pannes.');
    }

    return this.pannesService.create(body);
  }

  @Get()
  @Roles('administrateur', 'prestataire')
  findAll() {
    return this.pannesService.findAll();
  }

  @Get('user/:id')
  @Roles('client', 'administrateur')
  findByUser(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const userId = Number(id);

    if (user.type === 'client' && user.sub !== userId) {
      throw new ForbiddenException('Accès interdit à cet historique.');
    }

    return this.pannesService.findByUser(userId);
  }
}