import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import {
  OrigineOt,
  PERMISSIONS,
  PrioriteOt,
  StatutDi,
  TypeMaintenance,
  prioriteDepuisCriticite,
} from '../../common/constants/enums';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { paginer, PaginationDto } from '../../common/dto/pagination.dto';
import { genererNumero } from '../../common/utils/numero.util';
import { DemandeIntervention, Equipement, Notification, OrdreTravail } from '../../database/entities';

class CreerDiDto {
  @IsInt() equipementId: number;
  @IsString() description: string;
  @IsOptional() @IsEnum(PrioriteOt) urgence?: PrioriteOt;
  @IsOptional() @IsBoolean() arretProduction?: boolean;
  @IsOptional() @IsString() clientUuid?: string;
}

class FiltreDiDto extends PaginationDto {
  @IsOptional() @IsEnum(StatutDi) statut?: StatutDi;
}

@Controller()
export class DemandesController {
  constructor(
    @InjectRepository(DemandeIntervention) private readonly repo: Repository<DemandeIntervention>,
    @InjectRepository(Equipement) private readonly equipements: Repository<Equipement>,
    @InjectRepository(OrdreTravail) private readonly ots: Repository<OrdreTravail>,
    @InjectRepository(Notification) private readonly notifs: Repository<Notification>,
    private readonly ds: DataSource,
  ) {}

  @Get('demandes')
  @Permissions(PERMISSIONS.DEMANDE_LIRE)
  async lister(@Query() q: FiltreDiDto, @UtilisateurCourant() user: { id: number; roleCode: string }) {
    const page = Number(q.page ?? 1);
    const limite = Number(q.limite ?? 25);
    const qb = this.repo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.equipement', 'e')
      .leftJoinAndSelect('d.demandeur', 'u')
      .orderBy('d.dateDemande', 'DESC')
      .skip((page - 1) * limite)
      .take(limite);
    if (q.statut) qb.andWhere('d.statut = :st', { st: q.statut });
    // Un demandeur ne voit que ses propres demandes.
    if (user.roleCode === 'DEMANDEUR') qb.andWhere('d.demandeurId = :uid', { uid: user.id });
    const [donnees, total] = await qb.getManyAndCount();
    return paginer(donnees, total, page, limite);
  }

  @Get('demandes/:id')
  @Permissions(PERMISSIONS.DEMANDE_LIRE)
  async fiche(@Param('id', ParseIntPipe) id: number) {
    const d = await this.repo.findOne({
      where: { id },
      relations: ['equipement', 'equipement.localisation', 'demandeur'],
    });
    if (!d) throw new NotFoundException({ message: 'Demande introuvable.' });
    return d;
  }

  @Post('demandes')
  @Permissions(PERMISSIONS.DEMANDE_CREER)
  async creer(@Body() dto: CreerDiDto, @UtilisateurCourant() user: { id: number }) {
    if (dto.clientUuid) {
      const doublon = await this.repo.findOne({ where: { clientUuid: dto.clientUuid } });
      if (doublon) return doublon; // RG-23 idempotence
    }
    const eq = await this.equipements.findOne({ where: { id: dto.equipementId } });
    if (!eq) throw new NotFoundException({ message: 'Équipement introuvable.' });
    const numero = await genererNumero(this.ds, 'DI');
    const di = await this.repo.save(
      this.repo.create({
        numero,
        equipementId: dto.equipementId,
        demandeurId: user.id,
        description: dto.description,
        urgence: dto.urgence ?? PrioriteOt.P3_NORMALE,
        arretProduction: dto.arretProduction ?? false,
        clientUuid: dto.clientUuid ?? null,
      }),
    );
    return this.fiche(di.id);
  }

  /** RG-14 : conversion réservée aux profils habilités, numéro OT généré serveur. */
  @Post('demandes/:id/convertir')
  @Permissions(PERMISSIONS.DEMANDE_VALIDER)
  async convertir(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { priorite?: PrioriteOt },
    @UtilisateurCourant() user: { id: number },
  ) {
    const di = await this.repo.findOne({ where: { id }, relations: ['equipement'] });
    if (!di) throw new NotFoundException({ message: 'Demande introuvable.' });
    if (di.statut !== StatutDi.NOUVELLE) {
      throw new BadRequestException({ message: 'Seule une demande nouvelle peut être convertie.' });
    }
    const numero = await genererNumero(this.ds, 'OT');
    const ot = await this.ots.save(
      this.ots.create({
        numero,
        equipementId: di.equipementId,
        typeMaintenance: TypeMaintenance.CORRECTIF,
        origine: OrigineOt.DEMANDE,
        demandeId: di.id,
        priorite: body.priorite ?? prioriteDepuisCriticite(di.equipement.criticite),
        descriptionDemandee: di.description,
        creePar: user.id,
      }),
    );
    di.statut = StatutDi.CONVERTIE;
    di.otId = ot.id;
    di.traitePar = user.id;
    di.dateTraitement = new Date();
    await this.repo.save(di);
    await this.notifs.save(
      this.notifs.create({
        destinataireId: di.demandeurId,
        type: 'DI_CONVERTIE',
        titre: `Demande ${di.numero} acceptée`,
        message: `Votre demande a été convertie en ordre de travail ${ot.numero}.`,
        lien: `/ordres-travail/${ot.id}`,
      }),
    );
    return { demande: di, ordreTravail: ot };
  }

  @Post('demandes/:id/rejeter')
  @Permissions(PERMISSIONS.DEMANDE_VALIDER)
  async rejeter(
    @Param('id', ParseIntPipe) id: number,
    @Body('motif') motif: string,
    @UtilisateurCourant() user: { id: number },
  ) {
    if (!motif || motif.trim().length < 3) {
      throw new BadRequestException({ message: 'Le motif de rejet est obligatoire.' });
    }
    const di = await this.repo.findOne({ where: { id } });
    if (!di) throw new NotFoundException({ message: 'Demande introuvable.' });
    if (di.statut !== StatutDi.NOUVELLE) {
      throw new BadRequestException({ message: 'Cette demande ne peut plus être rejetée.' });
    }
    di.statut = StatutDi.REJETEE;
    di.motifRejet = motif.trim();
    di.traitePar = user.id;
    di.dateTraitement = new Date();
    await this.repo.save(di);
    await this.notifs.save(
      this.notifs.create({
        destinataireId: di.demandeurId,
        type: 'DI_REJETEE',
        titre: `Demande ${di.numero} rejetée`,
        message: motif.trim(),
        lien: `/demandes/${di.id}`,
      }),
    );
    return di;
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([DemandeIntervention, Equipement, OrdreTravail, Notification])],
  controllers: [DemandesController],
})
export class DemandesModule {}
