import { Controller, Get, Module, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { Notification } from '../../database/entities';

@Controller('notifications')
class NotificationsController {
  constructor(@InjectRepository(Notification) private readonly repo: Repository<Notification>) {}

  @Get()
  lister(@UtilisateurCourant() user: { id: number }) {
    return this.repo.find({
      where: { destinataireId: user.id },
      order: { dateCreation: 'DESC' },
      take: 50,
    });
  }

  @Patch(':id/lire')
  async lire(@Param('id', ParseIntPipe) id: number, @UtilisateurCourant() user: { id: number }) {
    await this.repo.update({ id: String(id), destinataireId: user.id }, { lu: true });
    return { message: 'Notification marquée comme lue.' };
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
