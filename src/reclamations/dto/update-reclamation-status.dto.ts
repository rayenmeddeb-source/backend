import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateReclamationStatusDto {
  @IsString()
  @IsIn(['En attente', 'En cours', 'Résolue', 'Rejetée'])
  statut: 'En attente' | 'En cours' | 'Résolue' | 'Rejetée';

  @IsOptional()
  @IsString()
  reponse_admin?: string;
}