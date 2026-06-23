export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const fmtKm = (km: number) => `${km.toFixed(1).replace('.', ',')} km`;
