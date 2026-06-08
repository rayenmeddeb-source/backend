import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';

@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  create(@Body() body: any) {
    return this.evaluationsService.create(body);
  }

  @Get('prestataire/:id')
  findByPrestataire(@Param('id') id: string) {
    return this.evaluationsService.findByPrestataire(+id);
  }

  @Get('stats/:id')
  stats(@Param('id') id: string) {
    return this.evaluationsService.stats(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.evaluationsService.update(+id, body.client_id, {
      note: body.note,
      commentaire: body.commentaire,
    });
  }

  @Delete(':id/client/:clientId')
  remove(@Param('id') id: string, @Param('clientId') clientId: string) {
    return this.evaluationsService.remove(+id, +clientId);
  }
  @Get()
  findAll() {
  return this.evaluationsService.findAll();
}
}