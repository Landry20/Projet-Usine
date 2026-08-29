import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreerUtilisateurDto, ModifierUtilisateurDto, UtilisateursService } from './utilisateurs.service';

@ApiTags('Administration')
@Controller()
export class UtilisateursController {
  constructor(private readonly svc: UtilisateursService) {}

  @Get('utilisateurs')
  @Permissions(PERMISSIONS.UTILISATEUR_GERER)
  lister(@Query() q: PaginationDto) {
    return this.svc.lister(q);
  }

  @Post('utilisateurs')
  @Permissions(PERMISSIONS.UTILISATEUR_GERER)
  creer(@Body() dto: CreerUtilisateurDto) {
    return this.svc.creer(dto);
  }

  @Get('utilisateurs/:id')
  @Permissions(PERMISSIONS.UTILISATEUR_GERER)
  trouver(@Param('id', ParseIntPipe) id: number) {
    return this.svc.trouver(id);
  }

  @Patch('utilisateurs/:id')
  @Permissions(PERMISSIONS.UTILISATEUR_GERER)
  modifier(@Param('id', ParseIntPipe) id: number, @Body() dto: ModifierUtilisateurDto) {
    return this.svc.modifier(id, dto);
  }

  @Delete('utilisateurs/:id')
  @Permissions(PERMISSIONS.UTILISATEUR_GERER)
  desactiver(@Param('id', ParseIntPipe) id: number) {
    return this.svc.desactiver(id);
  }

  @Get('roles')
  @Permissions(PERMISSIONS.UTILISATEUR_GERER)
  roles() {
    return this.svc.listerRoles();
  }

  @Get('permissions')
  @Permissions(PERMISSIONS.UTILISATEUR_GERER)
  permissions() {
    return this.svc.listerPermissions();
  }

  @Patch('roles/:id/permissions')
  @Permissions(PERMISSIONS.UTILISATEUR_GERER)
  majPerms(@Param('id', ParseIntPipe) id: number, @Body('permissionIds') ids: number[]) {
    return this.svc.definirPermissionsRole(id, ids);
  }
}
