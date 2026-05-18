import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicule } from './vehicule.entity';

@Injectable()
export class VehiculesService {
  constructor(
    @InjectRepository(Vehicule)
    private readonly vehiculesRepository: Repository<Vehicule>,
  ) {}

  async create(data: {
    client_id: number;
    marque: string;
    modele: string;
    annee: number;
    immatriculation: string;
    carburant?: string;
  }) {
    const immatriculation = data.immatriculation.trim().toUpperCase();

    const existingVehicule = await this.vehiculesRepository.findOne({
      where: { immatriculation },
    });

    if (existingVehicule) {
      throw new BadRequestException('Cette immatriculation existe déjà.');
    }

    const vehicule = this.vehiculesRepository.create({
      ...data,
      immatriculation,
    });

    return this.vehiculesRepository.save(vehicule);
  }

  findAll() {
    return this.vehiculesRepository.find({
      order: { id: 'DESC' },
    });
  }

  findByClient(clientId: number) {
    return this.vehiculesRepository.find({
      where: { client_id: clientId },
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const vehicule = await this.vehiculesRepository.findOne({
      where: { id },
    });

    if (!vehicule) {
      throw new NotFoundException('Véhicule introuvable.');
    }

    return vehicule;
  }

  async update(
    id: number,
    data: {
      marque?: string;
      modele?: string;
      annee?: number;
      immatriculation?: string;
      carburant?: string;
    },
  ) {
    const vehicule = await this.findOne(id);

    if (data.immatriculation) {
      const immatriculation = data.immatriculation.trim().toUpperCase();

      if (immatriculation !== vehicule.immatriculation) {
        const existingVehicule = await this.vehiculesRepository.findOne({
          where: { immatriculation },
        });

        if (existingVehicule) {
          throw new BadRequestException('Cette immatriculation existe déjà.');
        }
      }

      data.immatriculation = immatriculation;
    }

    Object.assign(vehicule, data);

    return this.vehiculesRepository.save(vehicule);
  }

  async remove(id: number) {
    const vehicule = await this.findOne(id);

    await this.vehiculesRepository.remove(vehicule);

    return {
      message: 'Véhicule supprimé avec succès.',
    };
  }
}