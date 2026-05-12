import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { RendezVousService } from './rendez-vous.service';

@Controller('rendez-vous')
export class RendezVousController {
  constructor(private service: RendezVousService) {}

  @Post()
  create(@Body() body) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
  

  @Get('client/:id')
  findByClient(@Param('id') id: number) {
    return this.service.findByClient(id);
  }

  @Get('prestataire/:id')
  findByPrestataire(@Param('id') id: number) {
    return this.service.findByPrestataire(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() body) {
    return this.service.updateStatut(id, body.statut);
  }
}