import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reclamation } from './reclamation.entity';

@Injectable()
export class ReclamationsService {
  constructor(
    @InjectRepository(Reclamation)
    private readonly reclamationsRepository: Repository<Reclamation>,
  ) {}

  async create(data: {
    auteur_type: 'client' | 'prestataire';
    auteur_id: number;
    sujet: string;
    description: string;
  }) {
    const reclamation = this.reclamationsRepository.create({
      auteur_type: data.auteur_type,
      auteur_id: data.auteur_id,
      sujet: data.sujet,
      description: data.description,
      statut: 'En attente',
      reponse_admin: null,
    });

    return this.reclamationsRepository.save(reclamation);
  }

  findMine(auteurType: 'client' | 'prestataire', auteurId: number) {
    return this.reclamationsRepository.find({
      where: {
        auteur_type: auteurType,
        auteur_id: auteurId,
      },
      order: { id: 'DESC' },
    });
  }

  findAll() {
    return this.reclamationsRepository.find({
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const reclamation = await this.reclamationsRepository.findOne({
      where: { id },
    });

    if (!reclamation) {
      throw new NotFoundException('Réclamation introuvable.');
    }

    return reclamation;
  }

  async updateMine(
    id: number,
    auteurType: 'client' | 'prestataire',
    auteurId: number,
    data: {
      sujet: string;
      description: string;
    },
  ) {
    const reclamation = await this.findOne(id);

    if (
      reclamation.auteur_type !== auteurType ||
      reclamation.auteur_id !== auteurId
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres réclamations.',
      );
    }

    if (reclamation.statut !== 'En attente') {
      throw new ForbiddenException(
        'Vous ne pouvez modifier qu’une réclamation en attente.',
      );
    }

    reclamation.sujet = data.sujet;
    reclamation.description = data.description;

    return this.reclamationsRepository.save(reclamation);
  }

  async removeMine(
    id: number,
    auteurType: 'client' | 'prestataire',
    auteurId: number,
  ) {
    const reclamation = await this.findOne(id);

    if (
      reclamation.auteur_type !== auteurType ||
      reclamation.auteur_id !== auteurId
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres réclamations.',
      );
    }

    if (reclamation.statut !== 'En attente') {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer qu’une réclamation en attente.',
      );
    }

    await this.reclamationsRepository.remove(reclamation);

    return {
      message: 'Réclamation supprimée avec succès.',
    };
  }

  async updateStatus(
    id: number,
    data: {
      statut: 'En attente' | 'En cours' | 'Résolue' | 'Rejetée';
      reponse_admin?: string;
    },
  ) {
    const reclamation = await this.findOne(id);

    reclamation.statut = data.statut;
    reclamation.reponse_admin =
      data.reponse_admin ?? reclamation.reponse_admin ?? null;

    return this.reclamationsRepository.save(reclamation);
  }
}