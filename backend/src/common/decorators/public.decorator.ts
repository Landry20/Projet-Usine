import { SetMetadata } from '@nestjs/common';

export const CLE_PUBLIC = 'est_public';
export const Public = () => SetMetadata(CLE_PUBLIC, true);
