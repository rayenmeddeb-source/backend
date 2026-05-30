import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ReclamationsService } from './reclamations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user.interface';
import { CreateReclamationDto } from './dto/create-reclamation.dto';
import { UpdateReclamationStatusDto } from './dto/update-reclamation-status.dto';

@Controller('reclamations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReclamationsController {
  constructor(private readonly reclamationsService: ReclamationsService) {}

  @Post()
  @Roles('client', 'prestataire')
  create(@CurrentUser() user: AuthUser, @Body() body: CreateReclamationDto) {
    const auteurType = user.type as 'client' | 'prestataire';

    return this.reclamationsService.create({
      auteur_type: auteurType,
      auteur_id: user.sub,
      sujet: body.sujet,
      description: body.description,
      prestataire_id: body.prestataire_id,
      client_id: body.client_id,
    });
  }

  @Get('me')
  @Roles('client', 'prestataire')
  findMine(@CurrentUser() user: AuthUser) {
    const auteurType = user.type as 'client' | 'prestataire';
    return this.reclamationsService.findMine(auteurType, user.sub);
  }

  @Get()
  @Roles('administrateur')
  findAll() {
    return this.reclamationsService.findAll();
  }

  @Get(':id')
  @Roles('administrateur', 'client', 'prestataire')
  findOne(@Param('id') id: string) {
    return this.reclamationsService.findOne(Number(id));
  }

  @Put(':id')
  @Roles('client', 'prestataire')
  updateMine(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: CreateReclamationDto,
  ) {
    const auteurType = user.type as 'client' | 'prestataire';

    return this.reclamationsService.updateMine(
      Number(id),
      auteurType,
      user.sub,
      body,
      
    );
  }

  @Delete(':id')
  @Roles('client', 'prestataire')
  deleteMine(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const auteurType = user.type as 'client' | 'prestataire';

    return this.reclamationsService.removeMine(
      Number(id),
      auteurType,
      user.sub,
    );
  }

  @Patch(':id/statut')
  @Roles('administrateur')
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateReclamationStatusDto,
  ) {
    return this.reclamationsService.updateStatus(Number(id), body);
  }
}