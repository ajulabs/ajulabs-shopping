import type { Request } from 'express';

type MulterFile = Express.Multer.File;
type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void;

/**
 * Tipos de imagem aceitos em uploads (foto de perfil, documentos, produtos, lojas).
 */
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Tipos de áudio aceitos (transcrição de voz no chat).
 */
const AUDIO_MIME_TYPES = new Set([
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
]);

function makeFilter(allowed: Set<string>, label: string) {
  return (_req: Request, file: MulterFile, cb: FileFilterCallback) => {
    if (allowed.has(file.mimetype)) {
      cb(null, true);
    } else {
      // Erro com statusCode 400 → o error handler global responde como erro do
      // cliente (não 500). Rejeita o arquivo sem derrubar o servidor.
      const err = new Error(`Tipo de arquivo inválido. Esperado: ${label}.`) as Error & {
        statusCode?: number;
      };
      err.statusCode = 400;
      cb(err);
    }
  };
}

/** fileFilter do multer que aceita apenas imagens (jpeg/png/webp). */
export const imageFileFilter = makeFilter(IMAGE_MIME_TYPES, 'imagem (JPEG, PNG ou WebP)');

/** fileFilter do multer que aceita apenas áudio. */
export const audioFileFilter = makeFilter(AUDIO_MIME_TYPES, 'áudio');
