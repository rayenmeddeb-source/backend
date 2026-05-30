import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('reclamations')
export class Reclamation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  auteur_type: 'client' | 'prestataire';

  @Column()
  auteur_id: number;

  @Column()
  sujet: string;

  @Column('text')
  description: string;

  @Column({
  type: 'integer',
  nullable: true,
})
  prestataire_id: number | null;

  @Column({
    default: 'En attente',
  })
  statut: 'En attente' | 'En cours' | 'Résolue' | 'Rejetée';

  @Column({
    type: 'text',
    nullable: true,
  })
  reponse_admin: string | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({
    type: 'integer',
    nullable: true,
  })
  client_id: number | null;
}