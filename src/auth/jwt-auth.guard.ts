import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthUser } from './auth-user.interface';
import { verify } from 'jsonwebtoken';

type AuthenticatedRequest = Request & { user?: AuthUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Token d\'authentification manquant.');
    }

    try {
      const secret = process.env.JWT_SECRET || 'dev-only-secret-change-in-production';
      const decoded = verify(token, secret);

      if (
        !decoded ||
        typeof decoded === 'string' ||
        typeof decoded.sub !== 'number' ||
        typeof decoded.email !== 'string' ||
        typeof decoded.type !== 'string'
      ) {
        throw new UnauthorizedException('Token invalide ou expiré.');
      }

      if (
        decoded.type !== 'client' &&
        decoded.type !== 'prestataire' &&
        decoded.type !== 'administrateur'
      ) {
        throw new UnauthorizedException('Token invalide ou expiré.');
      }

      const payload: AuthUser = {
        sub: decoded.sub,
        email: decoded.email,
        type: decoded.type,
      };
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré.');
    }
  }

  private extractBearerToken(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return undefined;
    }

    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) {
      return undefined;
    }

    return token;
  }
}