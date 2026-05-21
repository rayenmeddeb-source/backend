import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('chatbot_history')
export class ChatbotHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: number;

  @Column('text')
  message_client: string;

  @Column('text')
  reponse_bot: string;

  @Column({ nullable: true })
  diagnostic: string;

  @Column({ type: 'int', default: 0 })
  confidence: number;

  @CreateDateColumn()
  created_at: Date;
}