import React from 'react';
import { View, Text } from 'react-native';

/** Estado vazio padronizado (ícone + título + descrição). Espelha o web. */
export function EmptyState({ icone, titulo, descricao }: { icone: string; titulo: string; descricao?: string }) {
  return (
    <View className="items-center px-6 py-16">
      <Text className="mb-3 text-5xl">{icone}</Text>
      <Text className="text-center text-base font-bold text-slate-700">{titulo}</Text>
      {descricao ? <Text className="mt-1.5 text-center text-sm text-slate-400">{descricao}</Text> : null}
    </View>
  );
}
