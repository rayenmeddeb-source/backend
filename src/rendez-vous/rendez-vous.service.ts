import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RendezVous } from './rendez-vous.entity';

@Injectable()
export class RendezVousService {
  constructor(
    @InjectRepository(RendezVous)
    private repo: Repository<RendezVous>,
  ) {}

  async create(data: Partial<RendezVous>) {
    const selectedDate = new Date(data.date_rdv as Date);

    if (selectedDate < new Date()) {
      throw new BadRequestException(
        'Impossible de réserver un rendez-vous dans le passé.',
      );
    }

    const rdv = this.repo.create({
      client_id: data.client_id,
      prestataire_id: data.prestataire_id,
      vehicule_id: data.vehicule_id,
      date_rdv: data.date_rdv,
      statut: data.statut || 'En attente',
    });

    return this.repo.save(rdv);
  }

  findAll() {
    return this.repo.find({
      relations: ['client', 'prestataire', 'vehicule'],
      order: { id: 'DESC' },
    });
  }

  findByClient(client_id: number) {
    return this.repo.find({
      where: { client_id },
      relations: ['client', 'prestataire', 'vehicule'],
      order: { id: 'DESC' },
    });
  }

  findByPrestataire(prestataire_id: number) {
    return this.repo.find({
      where: { prestataire_id },
      relations: ['client', 'prestataire', 'vehicule'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const rdv = await this.repo.findOne({
      where: { id },
      relations: ['client', 'prestataire', 'vehicule'],
    });

    if (!rdv) {
      throw new NotFoundException('Rendez-vous introuvable.');
    }

    return rdv;
  }

  async updateStatut(id: number, statut: string) {
    const rdv = await this.findOne(id);
    rdv.statut = statut;

    await this.repo.save(rdv);
    return this.findOne(id);
  }
}