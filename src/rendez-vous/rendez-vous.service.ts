import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RendezVous } from './rendez-vous.entity';

@Injectable()
export class RendezVousService {
  constructor(
    @InjectRepository(RendezVous)
    private repo: Repository<RendezVous>,
  ) {}

  private getDateRange(date: Date) {
    const start = new Date(date);
    const end = new Date(date);

    start.setMinutes(start.getMinutes() - 30);
    end.setMinutes(end.getMinutes() + 30);

    return { start, end };
  }

  async create(data: Partial<RendezVous>) {
    if (
      !data.client_id ||
      !data.prestataire_id ||
      !data.vehicule_id ||
      !data.date_rdv
    ) {
      throw new BadRequestException(
        'Client, prestataire, véhicule et date sont obligatoires.',
      );
    }

    const selectedDate = new Date(data.date_rdv as Date);

    if (Number.isNaN(selectedDate.getTime())) {
      throw new BadRequestException('Date de rendez-vous invalide.');
    }

    if (selectedDate < new Date()) {
      throw new BadRequestException(
        'Impossible de réserver un rendez-vous dans le passé.',
      );
    }

    const { start, end } = this.getDateRange(selectedDate);

    const existingRdv = await this.repo
      .createQueryBuilder('rdv')
      .where('rdv.prestataire_id = :prestataire_id', {
        prestataire_id: data.prestataire_id,
      })
      .andWhere('rdv.date_rdv BETWEEN :start AND :end', {
        start,
        end,
      })
      .andWhere('rdv.statut NOT IN (:...excludedStatuses)', {
        excludedStatuses: [
          'Annulé',
          'Annule',
          'Refusé',
          'Refuse',
          'Terminé',
          'Termine',
        ],
      })
      .getOne();

    if (existingRdv) {
      throw new BadRequestException(
        'Ce prestataire possède déjà un rendez-vous proche de cet horaire.',
      );
    }

    const rdv = new RendezVous();

    rdv.client_id = Number(data.client_id);
    rdv.prestataire_id = Number(data.prestataire_id);
    rdv.vehicule_id = Number(data.vehicule_id);
    rdv.date_rdv = selectedDate;
    rdv.statut = data.statut || 'En attente';

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

    if (!statut) {
      throw new BadRequestException('Le statut est obligatoire.');
    }

    rdv.statut = statut;

    await this.repo.save(rdv);
    return this.findOne(id);
  }
}