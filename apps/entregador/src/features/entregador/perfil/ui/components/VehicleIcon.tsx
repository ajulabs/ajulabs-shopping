import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tipo, TIPO_ICON } from '../../model/useVeiculo';

export function VehicleIcon({ tipo, size, color }: { tipo: Tipo; size: number; color: string }) {
  const { icon, lib } = TIPO_ICON[tipo] ?? TIPO_ICON.moto;
  if (lib === 'mci') return <MaterialCommunityIcons name={icon as any} size={size} color={color} />;
  return <Ionicons name={icon as any} size={size} color={color} />;
}
