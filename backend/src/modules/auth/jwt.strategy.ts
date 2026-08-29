import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { compartimentsDuRole } from '../../common/constants/enums';
import { Utilisateur } from '../../database/entities';

export interface JetonPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    @InjectRepository(Utilisateur) private readonly users: Repository<Utilisateur>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JetonPayload) {
    const user = await this.users.findOne({
      where: { id: payload.sub, actif: true },
      relations: ['role', 'role.permissions', 'site'],
    });
    if (!user) {
      throw new UnauthorizedException({
        code: 'COMPTE_INACTIF',
        message: 'Compte introuvable ou désactivé.',
      });
    }
    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      roleId: user.roleId,
      roleCode: user.role?.code,
      roleLibelle: user.role?.libelle,
      siteId: user.siteId,
      doitChangerMdp: user.doitChangerMdp,
      permissions: (user.role?.permissions ?? []).map((p) => p.code),
      compartiments: compartimentsDuRole(user.role?.code),
    };
  }
}
