import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { UsersService } from '../users/users.service';
import type { CurrentUserPayload } from './current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    const tenantId = process.env.AZURE_TENANT_ID;
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: process.env.AZURE_CLIENT_ID,
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      algorithms: ['RS256'],
    });
  }

  async validate(
    payload: Record<string, unknown>,
  ): Promise<CurrentUserPayload> {
    const oid = payload.oid as string;
    const email = (payload.preferred_username ?? payload.upn) as string;
    const name = payload.name as string;

    const user = await this.usersService.findOrCreateByOid(oid, email, name);

    return { id: oid, email, name, role: user.role };
  }
}
