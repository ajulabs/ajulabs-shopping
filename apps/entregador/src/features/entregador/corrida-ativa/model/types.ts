import type { Stage } from '../../../../entities/corrida';

export { STAGES } from '../../../../entities/corrida';
export type { Stage, Ride, RideWithStage } from '../../../../entities/corrida';
export type { Ride as ActiveRide } from '../../../../entities/corrida';

export const STAGE_LABEL: Record<Stage, string> = {
  'to-store': 'Indo ao estabelecimento',
  'at-store': 'Aguardando retirada',
  'to-customer': 'Indo ao cliente',
  delivered: 'Entrega concluída',
};
