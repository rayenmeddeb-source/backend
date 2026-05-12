import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from './service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly servicesRepository: Repository<ServiceEntity>,
  ) {}

  async create(data: {
    prestataire_id: number;
    titre: string;
    description?: string;
    categorie: string;
    prix_min?: number;
    prix_max?: number;
  }) {
    if (
      data.prix_min !== undefined &&
      data.prix_max !== undefined &&
      Number(data.prix_min) > Number(data.prix_max)
    ) {
      throw new BadRequestException(
        'Le prix minimum ne peut pas être supérieur au prix maximum.',
      );
    }

    const service = new ServiceEntity();
    service.prestataire_id = data.prestataire_id;
    service.titre = data.titre;
    service.description = data.description ?? null;
    service.categorie = data.categorie;
    service.prix_min =
      data.prix_min !== undefined ? Number(data.prix_min) : null;
    service.prix_max =
      data.prix_max !== undefined ? Number(data.prix_max) : null;

    return this.servicesRepository.save(service);
  }

  findAll() {
    return this.servicesRepository.find({
      order: { id: 'DESC' },
    });
  }

  findByPrestataire(prestataireId: number) {
    return this.servicesRepository.find({
      where: { prestataire_id: prestataireId },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const service = await this.servicesRepository.findOne({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service introuvable.');
    }

    return service;
  }

  async update(
    id: number,
    data: {
      titre?: string;
      description?: string;
      categorie?: string;
      prix_min?: number;
      prix_max?: number;
    },
  ) {
    const service = await this.findOne(id);

    const newPrixMin =
      data.prix_min !== undefined
        ? Number(data.prix_min)
        : service.prix_min !== null
        ? Number(service.prix_min)
        : NaN;

    const newPrixMax =
      data.prix_max !== undefined
        ? Number(data.prix_max)
        : service.prix_max !== null
        ? Number(service.prix_max)
        : NaN;

    if (
      !Number.isNaN(newPrixMin) &&
      !Number.isNaN(newPrixMax) &&
      newPrixMin > newPrixMax
    ) {
      throw new BadRequestException(
        'Le prix minimum ne peut pas être supérieur au prix maximum.',
      );
    }

    if (data.titre !== undefined) {
      service.titre = data.titre;
    }

    if (data.description !== undefined) {
      service.description = data.description;
    }

    if (data.categorie !== undefined) {
      service.categorie = data.categorie;
    }

    if (data.prix_min !== undefined) {
      service.prix_min = Number(data.prix_min);
    }

    if (data.prix_max !== undefined) {
      service.prix_max = Number(data.prix_max);
    }

    return this.servicesRepository.save(service);
  }

  async remove(id: number) {
    const service = await this.findOne(id);
    await this.servicesRepository.remove(service);

    return {
      message: 'Service supprimé avec succès.',
    };
  }
}