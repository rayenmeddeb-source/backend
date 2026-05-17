import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsOptional()
  @IsString()
  prenom?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}