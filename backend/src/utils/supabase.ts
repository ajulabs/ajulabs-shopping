import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_KEY ?? '',
);

export async function uploadImagemEntregador(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = mimeType.split('/')[1] || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: bucketError } = await supabase.storage.createBucket('entregadores', { public: true });
  if (bucketError && bucketError.message.includes('already exists')) {
    await supabase.storage.updateBucket('entregadores', { public: true });
  } else if (bucketError) {
    throw bucketError;
  }

  const { error } = await supabase.storage
    .from('entregadores')
    .upload(fileName, buffer, { contentType: mimeType });

  if (error) throw error;

  const { data } = supabase.storage.from('entregadores').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadDocumentoTrocaVeiculo(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = mimeType.split('/')[1] || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: bucketError } = await supabase.storage.createBucket('troca-veiculo', { public: true });
  if (bucketError && bucketError.message.includes('already exists')) {
    await supabase.storage.updateBucket('troca-veiculo', { public: true });
  } else if (bucketError) {
    throw bucketError;
  }

  const { error } = await supabase.storage
    .from('troca-veiculo')
    .upload(fileName, buffer, { contentType: mimeType });

  if (error) throw error;

  const { data } = supabase.storage.from('troca-veiculo').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadImagemLoja(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = mimeType.split('/')[1] || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: bucketError } = await supabase.storage.createBucket('lojas', { public: true });
  if (bucketError && bucketError.message.includes('already exists')) {
    await supabase.storage.updateBucket('lojas', { public: true });
  } else if (bucketError) {
    throw bucketError;
  }

  const { error } = await supabase.storage
    .from('lojas')
    .upload(fileName, buffer, { contentType: mimeType });

  if (error) throw error;

  const { data } = supabase.storage.from('lojas').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadImagemConsumidor(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = mimeType.split('/')[1] || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: bucketError } = await supabase.storage.createBucket('consumidores', { public: true });
  if (bucketError && bucketError.message.includes('already exists')) {
    await supabase.storage.updateBucket('consumidores', { public: true });
  } else if (bucketError) {
    throw bucketError;
  }

  const { error } = await supabase.storage
    .from('consumidores')
    .upload(fileName, buffer, { contentType: mimeType });

  if (error) throw error;

  const { data } = supabase.storage.from('consumidores').getPublicUrl(fileName);
  return data.publicUrl;
}

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
