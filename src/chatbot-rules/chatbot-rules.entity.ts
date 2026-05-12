import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chatbot_rules')
export class ChatbotRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mot_cle: string;

  @Column({ type: 'text' })
  diagnostic: string;

  @Column()
  gravite: string;

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  cout_min: number | null;

  @Column('numeric', { precision: 10, scale: 2, nullable: true })
  cout_max: number | null;

  @Column({ default: true })
  besoin_prestataire: boolean;

  @Column({ type: 'varchar', nullable: true })
  categorie: string | null;

  @Column({ default: true })
  actif: boolean;
}