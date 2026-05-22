const ALLOWED_IMAGE_SIGNATURES: Array<{ bytes: number[]; offset?: number }> = [
  { bytes: [0xff, 0xd8, 0xff] }, // JPEG
  { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }, // PNG
  { bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF
  { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // WebP (RIFF...WEBP)
];

export function isValidImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  return ALLOWED_IMAGE_SIGNATURES.some(({ bytes, offset = 0 }) =>
    bytes.every((byte, i) => buffer[offset + i] === byte),
  );
}

export function assertValidImage(buffer: Buffer): void {
  if (!isValidImageBuffer(buffer)) {
    throw Object.assign(new Error('Formato de imagem inválido. Aceitos: JPEG, PNG, GIF, WebP.'), {
      statusCode: 400,
    });
  }
}
