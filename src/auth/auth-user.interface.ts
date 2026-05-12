export type UserRole = 'client' | 'prestataire' | 'administrateur';

export interface AuthUser {
  sub: number;
  email: string;
  type: UserRole;
}