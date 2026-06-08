import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('evaluations')
@Unique(['client_id', 'prestataire_id'])
export class Evaluation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: number;

  @Column()
  prestataire_id: number;

  @Column()
  note: number;

  @Column({ type: 'text', nullable: true })
  commentaire: string;

  @CreateDateColumn()
  created_at: Date;
}