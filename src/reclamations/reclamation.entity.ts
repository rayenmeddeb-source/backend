import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../auth/auth-user.interface';

@Entity('reclamations')
export class Reclamation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  auteur_type: Extract<UserRole, 'client' | 'prestataire'>;

  @Column()
  auteur_id: number;

  @Column({ type: 'varchar', length: 200 })
  sujet: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 30, default: 'En attente' })
  statut: 'En attente' | 'En cours' | 'Résolue' | 'Rejetée';

  @Column({ type: 'text', nullable: true })
  reponse_admin: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}