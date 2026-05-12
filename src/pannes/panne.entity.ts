import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pannes')
export class Panne {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  marque: string;

  @Column()
  modele: string;

  @Column()
  annee: number;

  @Column()
  immatriculation: string;

  @Column('text')
  description: string;

  @Column()
  urgence: string;

  @Column({ default: 'En attente' })
  statut: string;

  @Column('text', { nullable: true })
  diagnostic: string;

  @Column({ nullable: true })
  gravite: string;

  @Column({ default: false })
  besoin_mecanicien: boolean;
}