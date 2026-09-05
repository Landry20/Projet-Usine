import { Body, Controller, Get, Module, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Repository } from 'typeorm';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/enums';
import {
  CategorieArticle,
  CauseDefaillance,
  ChampPersonnalise,
  FamilleEquipement,
  Fournisseur,
  Parametre,
  Specialite,
} from '../../database/entities';

class CodeLibelleDto {
  @IsString() @MaxLength(20) code: string;
  @IsString() @MaxLength(150) libelle: string;
  @IsOptional() @IsString() categorie?: string;
}

class FournisseurDto {
  @IsString() code: string;
  @IsString() raisonSociale: string;
  @IsOptional() @IsString() contact?: string;
  @IsOptional() @IsString() telephone?: string;
  @IsOptional() @IsString() email?: string;
}

class ChampDto {
  @IsOptional() familleId?: number;
  @IsString() code: string;
  @IsString() libelle: string;
  @IsString() typeChamp: string;
  @IsOptional() @IsString() unite?: string;
  @IsOptional() valeursPossibles?: string[];
  @IsOptional() obligatoire?: boolean;
  @IsOptional() ordreAffichage?: number;
}

@Controller()
export class ReferentielsController {
  constructor(
    @InjectRepository(Specialite) private readonly specialites: Repository<Specialite>,
    @InjectRepository(CauseDefaillance) private readonly causes: Repository<CauseDefaillance>,
    @InjectRepository(FamilleEquipement) private readonly familles: Repository<FamilleEquipement>,
    @InjectRepository(CategorieArticle) private readonly categories: Repository<CategorieArticle>,
    @InjectRepository(Fournisseur) private readonly fournisseurs: Repository<Fournisseur>,
    @InjectRepository(Parametre) private readonly params: Repository<Parametre>,
    @InjectRepository(ChampPersonnalise) private readonly champs: Repository<ChampPersonnalise>,
  ) {}

  @Get('specialites')
  @Permissions(PERMISSIONS.REFERENTIEL_LIRE)
  specialitesListe() {
    return this.specialites.find({ order: { libelle: 'ASC' } });
  }

  @Post('specialites')
  @Permissions(PERMISSIONS.REFERENTIEL_GERER)
  creerSpecialite(@Body() dto: CodeLibelleDto) {
    return this.specialites.save(this.specialites.create({ code: dto.code.toUpperCase(), libelle: dto.libelle }));
  }

  @Get('causes')
  @Permissions(PERMISSIONS.REFERENTIEL_LIRE)
  causesListe() {
    return this.causes.find({ order: { libelle: 'ASC' } });
  }

  @Post('causes')
  @Permissions(PERMISSIONS.REFERENTIEL_GERER)
  creerCause(@Body() dto: CodeLibelleDto) {
    return this.causes.save(
      this.causes.create({ code: dto.code.toUpperCase(), libelle: dto.libelle, categorie: dto.categorie ?? null }),
    );
  }

  @Get('familles')
  @Permissions(PERMISSIONS.REFERENTIEL_LIRE)
  famillesListe() {
    return this.familles.find({ relations: ['champs'], order: { libelle: 'ASC' } });
  }

  @Post('familles')
  @Permissions(PERMISSIONS.REFERENTIEL_GERER)
  creerFamille(@Body() dto: CodeLibelleDto) {
    return this.familles.save(this.familles.create({ code: dto.code.toUpperCase(), libelle: dto.libelle }));
  }

  @Get('categories-articles')
  @Permissions(PERMISSIONS.REFERENTIEL_LIRE)
  cats() {
    return this.categories.find({ order: { libelle: 'ASC' } });
  }

  @Post('categories-articles')
  @Permissions(PERMISSIONS.REFERENTIEL_GERER)
  creerCat(@Body() dto: CodeLibelleDto) {
    return this.categories.save(this.categories.create({ code: dto.code.toUpperCase(), libelle: dto.libelle }));
  }

  @Get('fournisseurs')
  @Permissions(PERMISSIONS.REFERENTIEL_LIRE)
  fourns() {
    return this.fournisseurs.find({ order: { raisonSociale: 'ASC' } });
  }

  @Post('fournisseurs')
  @Permissions(PERMISSIONS.REFERENTIEL_GERER)
  creerFourn(@Body() dto: FournisseurDto) {
    return this.fournisseurs.save(this.fournisseurs.create({ ...dto, code: dto.code.toUpperCase() }));
  }

  @Get('parametres')
  @Permissions(PERMISSIONS.REFERENTIEL_LIRE)
  parametres() {
    return this.params.find();
  }

  @Patch('parametres/:cle')
  @Permissions(PERMISSIONS.REFERENTIEL_GERER)
  async majParam(@Param('cle') cle: string, @Body('valeur') valeur: string) {
    await this.params.update({ cle }, { valeur });
    return this.params.findOne({ where: { cle } });
  }

  @Get('champs-personnalises')
  @Permissions(PERMISSIONS.REFERENTIEL_LIRE)
  champsListe() {
    return this.champs.find({ relations: ['famille'], order: { ordreAffichage: 'ASC' } });
  }

  @Post('champs-personnalises')
  @Permissions(PERMISSIONS.REFERENTIEL_GERER)
  creerChamp(@Body() dto: ChampDto) {
    return this.champs.save(this.champs.create(dto));
  }

  @Get('familles/:id/champs')
  @Permissions(PERMISSIONS.REFERENTIEL_LIRE)
  champsFamille(@Param('id', ParseIntPipe) id: number) {
    return this.champs.find({ where: { familleId: id, actif: true }, order: { ordreAffichage: 'ASC' } });
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Specialite,
      CauseDefaillance,
      FamilleEquipement,
      CategorieArticle,
      Fournisseur,
      Parametre,
      ChampPersonnalise,
    ]),
  ],
  controllers: [ReferentielsController],
})
export class ReferentielsModule {}
