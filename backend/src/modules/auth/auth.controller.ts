import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { extraireIp } from '../../common/utils/numero.util';
import { AuthService } from './auth.service';
import { ChangerMotDePasseDto, ConnexionDto, ProfilDto, RafraichirDto } from './auth.dto';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /v1/auth/login — limitation stricte anti-brute-force. */
  @Public()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('login')
  connexion(@Body() dto: ConnexionDto, @Req() req: { headers: Record<string, unknown>; ip?: string }) {
    return this.auth.connexion(dto, req);
  }

  @Public()
  @Post('refresh')
  rafraichir(@Body() dto: RafraichirDto) {
    return this.auth.rafraichir(dto.refreshToken);
  }

  @Post('logout')
  deconnexion(
    @Body() dto: Partial<RafraichirDto>,
    @UtilisateurCourant() user: { id: number },
    @Req() req: { headers: Record<string, unknown>; ip?: string },
  ) {
    return this.auth.deconnexion(dto.refreshToken, user.id, extraireIp(req));
  }

  @Get('me')
  moi(@UtilisateurCourant() user: { id: number }) {
    return this.auth.profil(user.id);
  }

  @Patch('profil')
  majProfil(@UtilisateurCourant() user: { id: number }, @Body() dto: ProfilDto) {
    return this.auth.mettreAJourProfil(user.id, dto);
  }

  @Post('changer-mot-de-passe')
  changer(@UtilisateurCourant() user: { id: number }, @Body() dto: ChangerMotDePasseDto) {
    return this.auth.changerMotDePasse(user.id, dto);
  }
}
