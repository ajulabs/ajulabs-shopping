import type { CorsOptions } from 'cors';

type OriginFn = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => void;

function resolveOrigin(): string | OriginFn {
  const raw = process.env.ALLOWED_ORIGINS;
  if (process.env.NODE_ENV !== 'production' || !raw) return '*';

  const allowed = raw.split(',').map(s => s.trim()).filter(Boolean);
  return (origin, callback) => {
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error(`Origem não permitida: ${origin}`));
  };
}

const origin = resolveOrigin();

export const corsOptions: CorsOptions = { origin };
export const socketCorsOptions = { origin, methods: ['GET', 'POST'] } as const;
