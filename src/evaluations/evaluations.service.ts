import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation } from './evaluation.entity';
import { RendezVous } from '../rendez-vous/rendez-vous.entity';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(Evaluation)
    private evaluationRepo: Repository<Evaluation>,

    @InjectRepository(RendezVous)
    private rdvRepo: Repository<RendezVous>,
  ) {}

  async create(data: {
    client_id: number;
    prestataire_id: number;
    note: number;
    commentaire?: string;
  }) {
    const rdvTermine = await this.rdvRepo.findOne({
      where: {
        client_id: data.client_id,
        prestataire_id: data.prestataire_id,
        statut: 'Terminé',
      },
    });

    if (!rdvTermine) {
      throw new ForbiddenException(
        "Vous pouvez évaluer ce prestataire uniquement après un rendez-vous terminé.",
      );
    }

    const existe = await this.evaluationRepo.findOne({
      where: {
        client_id: data.client_id,
        prestataire_id: data.prestataire_id,
      },
    });

    if (existe) {
      throw new BadRequestException(
        'Vous avez déjà évalué ce prestataire.',
      );
    }

    const evaluation = this.evaluationRepo.create(data);
    return this.evaluationRepo.save(evaluation);
  }

  async findByPrestataire(prestataire_id: number) {
    return this.evaluationRepo.find({
      where: { prestataire_id },
      order: { created_at: 'DESC' },
    });
  }
  async findAll() {
    return this.evaluationRepo.find({
      order: { created_at: 'DESC' },
    });
  }

  async update(
    id: number,
    client_id: number,
    data: { note: number; commentaire?: string },
  ) {
    const evaluation = await this.evaluationRepo.findOne({ where: { id } });

    if (!evaluation) {
      throw new NotFoundException('Évaluation introuvable.');
    }

    if (evaluation.client_id !== client_id) {
      throw new ForbiddenException(
        "Vous ne pouvez modifier que votre propre évaluation.",
      );
    }

    evaluation.note = data.note;
    evaluation.commentaire = data.commentaire ?? evaluation.commentaire;

    return this.evaluationRepo.save(evaluation);
  }

  async remove(id: number, client_id: number) {
    const evaluation = await this.evaluationRepo.findOne({ where: { id } });

    if (!evaluation) {
      throw new NotFoundException('Évaluation introuvable.');
    }

    if (evaluation.client_id !== client_id) {
      throw new ForbiddenException(
        "Vous ne pouvez supprimer que votre propre évaluation.",
      );
    }

    return this.evaluationRepo.remove(evaluation);
  }

  async stats(prestataire_id: number) {
    const evaluations = await this.evaluationRepo.find({
      where: { prestataire_id },
    });

    const total = evaluations.length;

    if (total === 0) {
      return {
        moyenne: 0,
        total: 0,
        repartition: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
      };
    }

    const somme = evaluations.reduce((acc, e) => acc + e.note, 0);
    const moyenne = Number((somme / total).toFixed(1));

    const repartition = {
      1: evaluations.filter((e) => e.note === 1).length,
      2: evaluations.filter((e) => e.note === 2).length,
      3: evaluations.filter((e) => e.note === 3).length,
      4: evaluations.filter((e) => e.note === 4).length,
      5: evaluations.filter((e) => e.note === 5).length,
    };

    return {
      moyenne,
      total,
      repartition,
    };
  }
}