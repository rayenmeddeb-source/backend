import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
export class CreateReclamationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  sujet: string;

  @IsString()
  @IsNotEmpty()
  description: string;
   
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  prestataire_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  client_id?: number;
  
}