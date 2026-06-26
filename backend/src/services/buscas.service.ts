import { prisma } from '../utils/prisma';
import { logger } from '../lib/logger';

interface RegistrarBuscaParams {
  termo: string;
  usuarioId?: string;
  lojaId?: string;
  resultados: number;
}

/**
 * Registra uma busca de produto feita pelo usuário (via Aju), de forma
 * "fire-and-forget": NUNCA lança nem bloqueia o fluxo do chat. Esses dados
 * alimentam, no futuro, o insight de "demanda reprimida" do lojista
 * (termos muito buscados que retornam poucos/nenhum produto).
 *
 * `resultados = 0` é o sinal mais valioso: o usuário procurou e não achou nada.
 */
export async function registrarBusca(params: RegistrarBuscaParams): Promise<void> {
  const termo = (params.termo ?? '').trim();
  if (termo.length < 2) return; // ignora ruído / termos vazios

  try {
    await prisma.buscaProduto.create({
      data: {
        termo: termo.slice(0, 200),
        termoNormalizado: termo.toLowerCase().slice(0, 200),
        usuarioId: params.usuarioId || null,
        lojaId: params.lojaId || null,
        resultados: params.resultados,
      },
    });
  } catch (err) {
    // Logar não pode derrubar a busca: só avisa e segue.
    logger.warn({ err }, '[buscas] falha ao registrar busca (ignorado)');
  }
}
