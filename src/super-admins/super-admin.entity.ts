import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('super_admins')
export class SuperAdmin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;
}