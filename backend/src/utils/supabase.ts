import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_KEY ?? '',
);

export async function uploadImagemProduto(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = mimeType.split('/')[1] || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: bucketError } = await supabase.storage.createBucket('produtos', { public: true });
  if (bucketError && bucketError.message.includes('already exists')) {
    await supabase.storage.updateBucket('produtos', { public: true });
  } else if (bucketError) {
    throw bucketError;
  }

  const { error } = await supabase.storage
    .from('produtos')
    .upload(fileName, buffer, { contentType: mimeType });

  if (error) throw error;

  const { data } = supabase.storage.from('produtos').getPublicUrl(fileName);
  return data.publicUrl;
}
