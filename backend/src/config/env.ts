import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida'),
  DIRECT_URL: z.string().url('DIRECT_URL deve ser uma URL válida').optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter no mínimo 32 caracteres'),
  OPENAI_API_KEY: z.string().startsWith('sk-', 'OPENAI_API_KEY inválida'),
  SUPABASE_URL: z.string().url('SUPABASE_URL deve ser uma URL válida'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY obrigatória'),
  ALLOWED_ORIGINS: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
});

function validateEnv() {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  • ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`\n❌ Variáveis de ambiente inválidas:\n${errors}\n`);
  }

  return result.data;
}

export const env = validateEnv();
