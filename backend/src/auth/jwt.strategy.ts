import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
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

  validate(payload: Record<string, unknown>) {
    return {
      id: payload.oid as string,
      email: (payload.preferred_username ?? payload.upn) as string,
      name: payload.name as string,
    };
  }
}
