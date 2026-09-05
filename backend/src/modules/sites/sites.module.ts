import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Localisation, Site } from '../../database/entities';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { Repository } from 'typeorm';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/enums';
import { BadRequestException, NotFoundException } from '@nestjs/common';

class SiteDto {
  @IsString() @MaxLength(20) code: string;
  @IsString() @MaxLength(120) libelle: string;
  @IsOptional() @IsString() client?: string;
  @IsOptional() @IsString() adresse?: string;
  @IsOptional() @IsString() ville?: string;
}

class LocalisationDto {
  @IsInt() siteId: number;
  @IsOptional() @IsInt() parentId?: number;
  @IsString() @MaxLength(30) code: string;
  @IsString() @MaxLength(120) libelle: string;
  @IsOptional() @IsInt() niveau?: number;
}

@Controller()
export class SitesController {
  constructor(
    @InjectRepository(Site) private readonly sites: Repository<Site>,
    @InjectRepository(Localisation) private readonly locs: Repository<Localisation>,
  ) {}

  @Get('sites')
  @Permissions(PERMISSIONS.REFERENTIEL_LIRE)
  lister() {
    return this.sites.find({ order: { libelle: 'ASC' } });
  }

  @Post('sites')
  @Permissions(PERMISSIONS.REFERENTIEL_GERER)
  async creer(@Body() dto: SiteDto) {
    const existe = await this.sites.findOne({ where: { code: dto.code.toUpperCase() } });
    if (existe) throw new BadRequestException({ message: 'Ce code site existe déjà.' });
    return this.sites.save(this.sites.create({ ...dto, code: dto.code.toUpperCase() }));
  }

  @Patch('sites/:id')
  @Permissions(PERMISSIONS.REFERENTIEL_GERER)
  async modifier(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<SiteDto>) {
    const s = await this.sites.findOne({ where: { id } });
    if (!s) throw new NotFoundException({ message: 'Site introuvable.' });
    Object.assign(s, dto);
    return this.sites.save(s);
  }

  @Get('localisations')
  @Permissions(PERMISSIONS.REFERENTIEL_LIRE)
  listerLoc() {
    return this.locs.find({ relations: ['site', 'parent'], order: { libelle: 'ASC' } });
  }

  @Post('localisations')
  @Permissions(PERMISSIONS.REFERENTIEL_GERER)
  creerLoc(@Body() dto: LocalisationDto) {
    return this.locs.save(this.locs.create(dto));
  }

  @Delete('localisations/:id')
  @Permissions(PERMISSIONS.REFERENTIEL_GERER)
  async supprimerLoc(@Param('id', ParseIntPipe) id: number) {
    const l = await this.locs.findOne({ where: { id } });
    if (!l) throw new NotFoundException({ message: 'Localisation introuvable.' });
    await this.locs.remove(l);
    return { message: 'Localisation retirée.' };
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Site, Localisation])],
  controllers: [SitesController],
})
export class SitesModule {}
