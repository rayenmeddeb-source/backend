import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('vehicules')
export class Vehicule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: number;

  @Column()
  marque: string;

  @Column()
  modele: string;

  @Column()
  annee: number;

  @Column({ unique: true })
  immatriculation: string;

  @Column({ nullable: true })
  carburant: string;
}