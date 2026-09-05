import { Controller, Get, Module, Query } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISSIONS } from '../../common/constants/enums';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { paginer, PaginationDto } from '../../common/dto/pagination.dto';
import { JournalAudit } from '../../database/entities';

@Controller('audit')
export class AuditController {
  constructor(@InjectRepository(JournalAudit) private readonly repo: Repository<JournalAudit>) {}

  /** Lecture seule : aucun UPDATE/DELETE n'est exposé. */
  @Get()
  @Permissions(PERMISSIONS.AUDIT_LIRE)
  async lister(@Query() q: PaginationDto & { action?: string }) {
    const page = Number(q.page ?? 1);
    const limite = Number(q.limite ?? 25);
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.utilisateur', 'u')
      .orderBy('a.dateAction', 'DESC')
      .skip((page - 1) * limite)
      .take(limite);
    if (q.action) qb.andWhere('a.action = :ac', { ac: q.action });
    const [donnees, total] = await qb.getManyAndCount();
    return paginer(donnees, total, page, limite);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([JournalAudit])],
  controllers: [AuditController],
})
export class AuditModule {}
