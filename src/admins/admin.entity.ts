import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nom!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;
  @Column()
  specialite!: string;
}