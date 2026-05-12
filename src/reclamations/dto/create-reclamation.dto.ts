import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReclamationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  sujet: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}