import {
  BadRequestException,
  Controller,
  Get,
  Module,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Repository } from 'typeorm';
import { UtilisateurCourant } from '../../common/decorators/utilisateur-courant.decorator';
import { dossierUploads } from '../../common/utils/uploads.util';
import { PieceJointe } from '../../database/entities';
import { randomBytes } from 'crypto';

const MIME_AUTORISES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

@Controller()
class UploadsController {
  constructor(@InjectRepository(PieceJointe) private readonly repo: Repository<PieceJointe>) {}

  @Post('ordres-travail/:id/pieces-jointes')
  @UseInterceptors(
    FileInterceptor('fichier', {
      storage: diskStorage({
        destination: dossierUploads(),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`);
        },
      }),
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!MIME_AUTORISES.has(file.mimetype)) {
          cb(new BadRequestException({ message: 'Type de fichier non autorisé (JPEG, PNG, WEBP, PDF).' }), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async joindreOt(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() fichier: Express.Multer.File,
    @UtilisateurCourant() user: { id: number },
  ) {
    if (!fichier) throw new BadRequestException({ message: 'Fichier manquant.' });
    return this.repo.save(
      this.repo.create({
        entite: 'OT',
        entiteId: id,
        typeDocument: 'PHOTO',
        nomFichier: fichier.originalname,
        url: `/v1/fichiers/${fichier.filename}`,
        tailleKo: Math.round(fichier.size / 1024),
        ajoutePar: user.id,
      }),
    );
  }

  @Get('ordres-travail/:id/pieces-jointes')
  lister(@Param('id', ParseIntPipe) id: number) {
    return this.repo.find({ where: { entite: 'OT', entiteId: id }, order: { dateAjout: 'DESC' } });
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([PieceJointe])],
  controllers: [UploadsController],
})
export class UploadsModule {}
