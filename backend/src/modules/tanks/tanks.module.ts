import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import {
  ConclusionBulletin,
  PERMISSIONS,
  STATUTS_DOCUMENT_VERROUILLE,
  StatutCommandeClient,
  StatutValidation,
  TypeExpedition,
  TypeMvtTank,
} from '../../common/constants/enums';
import { Permissions, PermissionsAny } from '../../common/decorators/permissions.decorator';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { paginer, PaginationDto } from '../../common/dto/pagination.dto';
import { genererNumero } from '../../common/utils/numero.util';
import {
  BulletinAnalyse,
  Chargement,
  Client,
  CommandeClient,
  Expedition,
  Jaugeage,
  Produit,
  Tank,
  TankMouvement,
} from '../../database/entities';
import { appliquerMouvementTank } from '../quart/quart.module';

class TankDto {
  @IsString() code: string;
  @IsOptional() @IsString() libelle?: string;
  @IsNumber() @Min(1) capaciteLitres: number;
  @IsOptional() @IsInt() produitId?: number;
  @IsOptional() @IsInt() siteId?: number;
  @IsOptional() @IsInt() seuilHautPct?: number;
  @IsOptional() @IsInt() seuilBasPct?: number;
}

class JaugeDto {
  @IsOptional() @IsNumber() hauteurCm?: number;
  @IsOptional() @IsNumber() volumeLitres?: number;
  @IsOptional() @IsNumber() densite?: number;
  @IsOptional() @IsNumber() temperature?: number;
  @IsOptional() @IsString() observation?: string;
  @IsOptional() ajusterStock?: boolean;
}

class ClientDto {
  @IsString() code: string;
  @IsString() raisonSociale: string;
  @IsOptional() @IsString() pays?: string;
  @IsOptional() @IsString() contact?: string;
  @IsOptional() @IsString() telephone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() incoterm?: string;
}

class CommandeDto {
  @IsInt() clientId: number;
  @IsInt() produitId: number;
  @IsNumber() @Min(0.01) quantiteCommandeeKg: number;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsString() incoterm?: string;
  @IsOptional() @IsString() dateLivraisonPrevue?: string;
}

class ExpeditionDto {
  @IsInt() clientId: number;
  @IsOptional() @IsInt() commandeId?: number;
  @IsOptional() @IsEnum(TypeExpedition) type?: TypeExpedition;
  @IsOptional() @IsString() dateExpedition?: string;
  @IsOptional() @IsString() transporteur?: string;
  @IsOptional() @IsString() destination?: string;
}

class ChargementDto {
  @IsInt() tankId: number;
  @IsString() numeroConteneur: string;
  @IsString() numeroFlexitank: string;
  @IsNumber() @Min(0.01) quantiteLitres: number;
  @IsOptional() @IsNumber() densite?: number;
  @IsOptional() @IsNumber() temperature?: number;
  @IsOptional() @IsNumber() poidsTareKg?: number;
  @IsOptional() @IsNumber() poidsBrutKg?: number;
  @IsOptional() @IsInt() bulletinAnalyseId?: number;
  @IsOptional() @IsString() chauffeur?: string;
  @IsOptional() @IsString() transporteur?: string;
  @IsOptional() @IsString() numeroScelle?: string;
}

type UserCtx = { id: number; roleCode?: string };

function volumeDepuisHauteur(bareme: { hauteurCm: number; litres: number }[] | null, h: number) {
  if (!bareme?.length) {
    throw new BadRequestException({ message: 'Aucun barème de jaugeage sur ce tank : saisissez le volume.' });
  }
  const pts = [...bareme].sort((a, b) => a.hauteurCm - b.hauteurCm);
  if (h <= pts[0].hauteurCm) return pts[0].litres;
  const last = pts[pts.length - 1];
  if (h >= last.hauteurCm) return last.litres;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    if (h >= a.hauteurCm && h <= b.hauteurCm) {
      const t = (h - a.hauteurCm) / (b.hauteurCm - a.hauteurCm);
      return a.litres + t * (b.litres - a.litres);
    }
  }
  return last.litres;
}

@Controller()
class TanksController {
  constructor(
    @InjectRepository(Tank) private readonly tanks: Repository<Tank>,
    @InjectRepository(TankMouvement) private readonly mvts: Repository<TankMouvement>,
    @InjectRepository(Jaugeage) private readonly jauges: Repository<Jaugeage>,
    @InjectRepository(Client) private readonly clients: Repository<Client>,
    @InjectRepository(CommandeClient) private readonly commandes: Repository<CommandeClient>,
    @InjectRepository(Expedition) private readonly expeditions: Repository<Expedition>,
    @InjectRepository(Chargement) private readonly chargements: Repository<Chargement>,
    @InjectRepository(BulletinAnalyse) private readonly bulletins: Repository<BulletinAnalyse>,
    private readonly ds: DataSource,
  ) {}

  @Get('tanks')
  @PermissionsAny(PERMISSIONS.TANK_LIRE, PERMISSIONS.QUART_LIRE)
  async lister() {
    const liste = await this.tanks.find({ relations: ['produit', 'site'], order: { code: 'ASC' } });
    return liste.map((t) => {
      const capa = Number(t.capaciteLitres) || 1;
      const remplissage = Math.round((Number(t.stockLitres) / capa) * 1000) / 10;
      return {
        ...t,
        remplissagePct: remplissage,
        alerteHaut: remplissage >= t.seuilHautPct,
        alerteBas: remplissage <= t.seuilBasPct,
        disponibleLitres: Number(t.stockLitres) - Number(t.litresReserves),
      };
    });
  }

  @Get('tanks/:id')
  @Permissions(PERMISSIONS.TANK_LIRE)
  async fiche(@Param('id', ParseIntPipe) id: number) {
    const t = await this.tanks.findOne({ where: { id }, relations: ['produit', 'site'] });
    if (!t) throw new NotFoundException({ message: 'Tank introuvable.' });
    const mouvements = await this.mvts.find({ where: { tankId: id }, order: { dateMvt: 'DESC' }, take: 50 });
    const jaugeages = await this.jauges.find({ where: { tankId: id }, order: { dateJaugeage: 'DESC' }, take: 20, relations: ['effecteur'] });
    return { ...t, mouvements, jaugeages };
  }

  @Post('tanks')
  @Permissions(PERMISSIONS.TANK_GERER)
  creer(@Body() dto: TankDto) {
    return this.tanks.save(
      this.tanks.create({
        code: dto.code.toUpperCase(),
        libelle: dto.libelle ?? null,
        capaciteLitres: dto.capaciteLitres.toFixed(2),
        produitId: dto.produitId ?? null,
        siteId: dto.siteId ?? null,
        seuilHautPct: dto.seuilHautPct ?? 90,
        seuilBasPct: dto.seuilBasPct ?? 10,
        baremeJaugeage: [
          { hauteurCm: 0, litres: 0 },
          { hauteurCm: 400, litres: dto.capaciteLitres },
        ],
      }),
    );
  }

  @Get('tanks/:id/mouvements')
  @Permissions(PERMISSIONS.TANK_LIRE)
  mouvements(@Param('id', ParseIntPipe) id: number, @Query() q: PaginationDto) {
    return this.mvts.find({
      where: { tankId: id },
      order: { dateMvt: 'DESC' },
      skip: ((Number(q.page ?? 1) - 1) * Number(q.limite ?? 25)),
      take: Number(q.limite ?? 25),
    });
  }

  @Post('tanks/:id/jaugeages')
  @Permissions(PERMISSIONS.TANK_GERER)
  async jauger(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: JaugeDto,
    @UtilisateurCourant() user: UserCtx,
  ) {
    const tank = await this.tanks.findOne({ where: { id }, relations: ['produit'] });
    if (!tank) throw new NotFoundException({ message: 'Tank introuvable.' });
    const volume =
      dto.volumeLitres ??
      (dto.hauteurCm != null ? volumeDepuisHauteur(tank.baremeJaugeage, dto.hauteurCm) : null);
    if (volume == null) {
      throw new BadRequestException({ message: 'Indiquez une hauteur ou un volume.' });
    }
    const densite = dto.densite ?? Number(tank.produit?.densiteReference ?? 0.91);
    const theorique = Number(tank.stockLitres);
    const ecart = volume - theorique;
    const jauge = await this.jauges.save(
      this.jauges.create({
        tankId: id,
        hauteurCm: dto.hauteurCm != null ? String(dto.hauteurCm) : null,
        volumeLitres: volume.toFixed(2),
        densite: densite.toFixed(4),
        temperature: dto.temperature != null ? String(dto.temperature) : null,
        masseKg: (volume * densite).toFixed(2),
        stockTheoriqueL: theorique.toFixed(2),
        ecartLitres: ecart.toFixed(2),
        ecartPct: theorique > 0 ? ((ecart / theorique) * 100).toFixed(3) : null,
        effectuePar: user.id,
        observation: dto.observation ?? null,
      }),
    );
    if (dto.ajusterStock) {
      await this.ds.transaction((m) =>
        appliquerMouvementTank(m, {
          tankId: id,
          typeMvt: TypeMvtTank.AJUSTEMENT_JAUGE,
          quantiteLitres: ecart,
          densite,
          utilisateurId: user.id,
          motif: `Ajustement jauge ${jauge.id}`,
        }),
      );
    }
    return jauge;
  }

  @Get('clients')
  @PermissionsAny(PERMISSIONS.PF_LIRE, PERMISSIONS.TANK_LIRE)
  listerClients() {
    return this.clients.find({ where: { actif: true }, order: { raisonSociale: 'ASC' } });
  }

  @Post('clients')
  @Permissions(PERMISSIONS.PF_GERER)
  creerClient(@Body() dto: ClientDto) {
    return this.clients.save(
      this.clients.create({
        ...dto,
        code: dto.code.toUpperCase(),
      }),
    );
  }

  @Get('commandes-clients')
  @Permissions(PERMISSIONS.PF_LIRE)
  commandesListe() {
    return this.commandes.find({ relations: ['client', 'produit'], order: { id: 'DESC' } });
  }

  @Post('commandes-clients')
  @Permissions(PERMISSIONS.PF_GERER)
  async creerCommande(@Body() dto: CommandeDto) {
    const numero = await genererNumero(this.ds, 'CC');
    return this.commandes.save(
      this.commandes.create({
        numero,
        clientId: dto.clientId,
        produitId: dto.produitId,
        quantiteCommandeeKg: dto.quantiteCommandeeKg.toFixed(2),
        destination: dto.destination ?? null,
        incoterm: dto.incoterm ?? null,
        dateCommande: new Date().toISOString().slice(0, 10),
        dateLivraisonPrevue: dto.dateLivraisonPrevue ?? null,
      }),
    );
  }

  @Get('expeditions')
  @Permissions(PERMISSIONS.PF_LIRE)
  async listerExp(@Query() q: PaginationDto & { statut?: StatutValidation }) {
    const page = Number(q.page ?? 1);
    const limite = Number(q.limite ?? 25);
    const qb = this.expeditions
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.client', 'c')
      .leftJoinAndSelect('e.commande', 'cmd')
      .orderBy('e.createdAt', 'DESC')
      .skip((page - 1) * limite)
      .take(limite);
    if (q.statut) qb.andWhere('e.statut = :st', { st: q.statut });
    const [donnees, total] = await qb.getManyAndCount();
    return paginer(donnees, total, page, limite);
  }

  @Get('expeditions/:id')
  @Permissions(PERMISSIONS.PF_LIRE)
  async ficheExp(@Param('id', ParseIntPipe) id: number) {
    const e = await this.expeditions.findOne({
      where: { id },
      relations: ['client', 'commande', 'chargements', 'chargements.tank', 'chargements.bulletinAnalyse'],
    });
    if (!e) throw new NotFoundException({ message: 'Expédition introuvable.' });
    return e;
  }

  @Post('expeditions')
  @Permissions(PERMISSIONS.PF_EXPEDIER)
  async creerExp(@Body() dto: ExpeditionDto) {
    const numero = await genererNumero(this.ds, 'EXP');
    return this.expeditions.save(
      this.expeditions.create({
        numero,
        clientId: dto.clientId,
        commandeId: dto.commandeId ?? null,
        type: dto.type ?? TypeExpedition.CONTENEUR_FLEXITANK,
        dateExpedition: dto.dateExpedition ?? new Date().toISOString().slice(0, 10),
        transporteur: dto.transporteur ?? null,
        destination: dto.destination ?? null,
      }),
    );
  }

  @Post('expeditions/:id/chargements')
  @Permissions(PERMISSIONS.PF_EXPEDIER)
  async ajouterChargement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChargementDto,
    @UtilisateurCourant() user: UserCtx,
  ) {
    const exp = await this.expeditions.findOne({ where: { id } });
    if (!exp) throw new NotFoundException({ message: 'Expédition introuvable.' });
    if (STATUTS_DOCUMENT_VERROUILLE.includes(exp.statut as (typeof STATUTS_DOCUMENT_VERROUILLE)[number])) {
      throw new BadRequestException({ message: 'Expédition verrouillée.' });
    }
    const doublon = await this.chargements.findOne({ where: { numeroFlexitank: dto.numeroFlexitank } });
    if (doublon) {
      throw new BadRequestException({ message: `Flexitank ${dto.numeroFlexitank} déjà utilisé (RG-37).` });
    }
    const tank = await this.tanks.findOne({ where: { id: dto.tankId }, relations: ['produit'] });
    if (!tank) throw new NotFoundException({ message: 'Tank introuvable.' });
    const densite = dto.densite ?? Number(tank.produit?.densiteReference ?? 0.91);
    const masse = dto.quantiteLitres * densite;
    let poidsNet: number | null = null;
    if (dto.poidsBrutKg != null && dto.poidsTareKg != null) {
      poidsNet = dto.poidsBrutKg - dto.poidsTareKg;
    }
    const ch = await this.ds.transaction(async (m) => {
      const ligne = await m.save(
        m.create(Chargement, {
          expeditionId: id,
          tankId: dto.tankId,
          numeroConteneur: dto.numeroConteneur.toUpperCase(),
          numeroFlexitank: dto.numeroFlexitank.toUpperCase(),
          quantiteLitres: dto.quantiteLitres.toFixed(2),
          densite: densite.toFixed(4),
          temperature: dto.temperature != null ? String(dto.temperature) : null,
          masseCalculeeKg: masse.toFixed(2),
          poidsTareKg: dto.poidsTareKg != null ? dto.poidsTareKg.toFixed(2) : null,
          poidsBrutKg: dto.poidsBrutKg != null ? dto.poidsBrutKg.toFixed(2) : null,
          poidsNetKg: poidsNet != null ? poidsNet.toFixed(2) : null,
          ecartPeseeKg: poidsNet != null ? (poidsNet - masse).toFixed(2) : null,
          bulletinAnalyseId: dto.bulletinAnalyseId ?? null,
          chauffeur: dto.chauffeur ?? null,
          transporteur: dto.transporteur ?? null,
          numeroScelle: dto.numeroScelle ?? null,
          operateurId: user.id,
        }),
      );
      await appliquerMouvementTank(m, {
        tankId: dto.tankId,
        typeMvt: TypeMvtTank.CHARGEMENT,
        quantiteLitres: dto.quantiteLitres,
        densite,
        chargementId: ligne.id,
        utilisateurId: user.id,
        motif: `Chargement ${ligne.numeroFlexitank} / ${exp.numero}`,
      });
      return ligne;
    });
    await this.recalculerTotaux(id);
    return this.ficheExp(id);
  }

  @Patch('expeditions/:id/chargements/:cid/pesee')
  @Permissions(PERMISSIONS.PF_EXPEDIER)
  async pesee(
    @Param('id', ParseIntPipe) id: number,
    @Param('cid', ParseIntPipe) cid: number,
    @Body() dto: { poidsTareKg: number; poidsBrutKg: number },
  ) {
    const ch = await this.chargements.findOne({ where: { id: cid, expeditionId: id } });
    if (!ch) throw new NotFoundException({ message: 'Chargement introuvable.' });
    const net = dto.poidsBrutKg - dto.poidsTareKg;
    ch.poidsTareKg = dto.poidsTareKg.toFixed(2);
    ch.poidsBrutKg = dto.poidsBrutKg.toFixed(2);
    ch.poidsNetKg = net.toFixed(2);
    ch.ecartPeseeKg = (net - Number(ch.masseCalculeeKg ?? 0)).toFixed(2);
    await this.chargements.save(ch);
    await this.recalculerTotaux(id);
    return this.ficheExp(id);
  }

  /** RG-39 : bulletin conforme (ou dérogation) obligatoire avant clôture. */
  @Post('expeditions/:id/cloturer')
  @Permissions(PERMISSIONS.PF_EXPEDIER)
  async cloturer(@Param('id', ParseIntPipe) id: number) {
    const exp = await this.expeditions.findOne({
      where: { id },
      relations: ['chargements', 'chargements.bulletinAnalyse', 'commande'],
    });
    if (!exp) throw new NotFoundException({ message: 'Expédition introuvable.' });
    if (!exp.chargements?.length) {
      throw new BadRequestException({ message: 'Aucun chargement : impossible de clôturer.' });
    }
    for (const c of exp.chargements) {
      const ba = c.bulletinAnalyseId
        ? c.bulletinAnalyse ?? (await this.bulletins.findOneBy({ id: c.bulletinAnalyseId }))
        : null;
      if (!ba || ![ConclusionBulletin.CONFORME, ConclusionBulletin.DEROGATION].includes(ba.conclusion)) {
        throw new BadRequestException({
          code: 'BULLETIN_OBLIGATOIRE',
          message: `Chargement ${c.numeroConteneur} : bulletin conforme obligatoire avant départ (RG-39).`,
        });
      }
      if (![StatutValidation.APPROUVE, StatutValidation.DIFFUSE].includes(ba.statut)) {
        throw new BadRequestException({
          message: `Le bulletin ${ba.numero} n’est pas encore approuvé.`,
        });
      }
    }
    exp.statut = StatutValidation.APPROUVE;
    await this.expeditions.save(exp);
    if (exp.commandeId) {
      const cmd = await this.commandes.findOneBy({ id: exp.commandeId });
      if (cmd) {
        const livree = Number(cmd.quantiteLivreeKg) + Number(exp.totalKg);
        cmd.quantiteLivreeKg = livree.toFixed(2);
        cmd.statut =
          livree + 0.01 >= Number(cmd.quantiteCommandeeKg)
            ? StatutCommandeClient.LIVREE
            : StatutCommandeClient.PARTIELLE;
        await this.commandes.save(cmd);
      }
    }
    return this.ficheExp(id);
  }

  private async recalculerTotaux(id: number) {
    const lignes = await this.chargements.find({ where: { expeditionId: id } });
    const exp = await this.expeditions.findOneByOrFail({ id });
    exp.totalLitres = lignes.reduce((s, c) => s + Number(c.quantiteLitres), 0).toFixed(2);
    exp.totalKg = lignes
      .reduce((s, c) => s + Number(c.poidsNetKg ?? c.masseCalculeeKg ?? 0), 0)
      .toFixed(2);
    await this.expeditions.save(exp);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tank,
      TankMouvement,
      Jaugeage,
      Client,
      CommandeClient,
      Expedition,
      Chargement,
      BulletinAnalyse,
    ]),
  ],
  controllers: [TanksController],
})
export class TanksModule {}
