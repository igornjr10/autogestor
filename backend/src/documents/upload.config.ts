import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { BadRequestException } from '@nestjs/common';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');

// Garante que o diretório de uploads exista
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MIMES_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const uploadOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const unico = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unico}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
    if (!MIMES_PERMITIDOS.includes(file.mimetype)) {
      return cb(new BadRequestException('Tipo de arquivo não permitido (use JPG, PNG, WEBP ou PDF).'), false);
    }
    cb(null, true);
  },
};
