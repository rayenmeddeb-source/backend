import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../users/user.entity';
import { Admin } from '../admins/admin.entity';
import { Vehicule } from '../vehicules/vehicule.entity';

@Entity('rendez_vous')
export class RendezVous {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: number;

  @Column()
  prestataire_id: number;

  @Column()
  vehicule_id: number;

  @Column({ type: 'timestamp' })
  date_rdv: Date;

  @Column()
  statut: string;

  @Column({ nullable: true, type: 'timestamp' })
  created_at: Date;

  // =========================
  // RELATION CLIENT
  // =========================

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  // =========================
  // RELATION PRESTATAIRE
  // =========================

  @ManyToOne(() => Admin)
  @JoinColumn({ name: 'prestataire_id' })
  prestataire: Admin;

  // =========================
  // RELATION VEHICULE
  // =========================

  @ManyToOne(() => Vehicule)
  @JoinColumn({ name: 'vehicule_id' })
  vehicule: Vehicule;
}