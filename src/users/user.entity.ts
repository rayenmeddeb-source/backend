import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column({ nullable: true })
  prenom: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'varchar',
    default: 'EN_ATTENTE',
  })
  status: string;

  @Column({
    default: false,
  })
  email_verified: boolean;

  @Column({
    nullable: true,
  })
  verification_code: string;
}