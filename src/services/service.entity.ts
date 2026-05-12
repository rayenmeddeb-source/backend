import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('services')
export class ServiceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  prestataire_id: number;

  @Column()
  titre: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column()
  categorie: string;

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  prix_min: number | null;

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  prix_max: number | null;
}