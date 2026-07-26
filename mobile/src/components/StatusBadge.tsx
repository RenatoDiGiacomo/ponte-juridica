import React from 'react';
import { View, Text } from 'react-native';

export type CasoStatus = 'aberto' | 'em_atendimento' | 'encerrado';

const MAPA: Record<CasoStatus, { label: string; icone: string; bg: string; texto: string }> = {
  aberto: { label: 'Aberto', icone: '📢', bg: 'bg-blue-100', texto: 'text-blue-700' },
  em_atendimento: { label: 'Em atendimento', icone: '⚙️', bg: 'bg-emerald-100', texto: 'text-emerald-700' },
  encerrado: { label: 'Encerrado', icone: '✓', bg: 'bg-slate-200', texto: 'text-slate-600' },
};

/** Selo de status do caso (ícone + texto + cor — nunca só cor). Espelha o web. */
export function StatusBadge({ status }: { status: CasoStatus }) {
  const s = MAPA[status] ?? MAPA.aberto;
  return (
    <View className={`flex-row items-center gap-1 self-start rounded-full px-2.5 py-1 ${s.bg}`}>
      <Text className="text-xs">{s.icone}</Text>
      <Text className={`text-xs font-bold ${s.texto}`}>{s.label}</Text>
    </View>
  );
}
