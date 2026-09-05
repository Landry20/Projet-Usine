import { Body, Controller, Get, Module, NotFoundException, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Repository } from 'typeorm';
import { PERMISSIONS } from '../../common/constants/enums';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Technicien } from '../../database/entities';

class TechnicienDto {
  @IsString() matricule: string;
  @IsString() nomPrenom: string;
  @IsOptional() @IsInt() specialiteId?: number;
  @IsOptional() @IsInt() siteId?: number;
  @IsOptional() @IsInt() utilisateurId?: number;
  @IsOptional() @IsString() telephone?: string;
  @IsOptional() coutHoraire?: number;
  @IsOptional() @IsString() statut?: string;
}

@Controller('techniciens')
export class TechniciensController {
  constructor(@InjectRepository(Technicien) private readonly repo: Repository<Technicien>) {}

  @Get()
  @Permissions(PERMISSIONS.REFERENTIEL_LIRE)
  lister() {
    return this.repo.find({ relations: ['specialite', 'site', 'utilisateur'], order: { matricule: 'ASC' } });
  }

  @Get(':id')
  @Permissions(PERMISSIONS.REFERENTIEL_LIRE)
  async fiche(@Param('id', ParseIntPipe) id: number) {
    const t = await this.repo.findOne({ where: { id }, relations: ['specialite', 'site', 'utilisateur'] });
    if (!t) throw new NotFoundException({ message: 'Technicien introuvable.' });
    return t;
  }

  @Post()
  @Permissions(PERMISSIONS.REFERENTIEL_GERER)
  creer(@Body() dto: TechnicienDto) {
    return this.repo.save(
      this.repo.create({
        ...dto,
        matricule: dto.matricule.toUpperCase(),
        coutHoraire: String(dto.coutHoraire ?? 2500),
      }),
    );
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.REFERENTIEL_GERER)
  async modifier(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<TechnicienDto>) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException({ message: 'Technicien introuvable.' });
    Object.assign(t, dto);
    if (dto.coutHoraire != null) t.coutHoraire = String(dto.coutHoraire);
    return this.repo.save(t);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Technicien])],
  controllers: [TechniciensController],
})
export class TechniciensModule {}
