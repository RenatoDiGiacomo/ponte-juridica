import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { conexoesService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export function MinhasConexoesScreen() {
  const [conexoes, setConexoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();

  const carregar = useCallback(async () => {
    try {
      const { data } = await conexoesService.minhas();
      setConexoes(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function remover(id: number) {
    Alert.alert('Remover vínculo', 'Deseja remover este advogado?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive', onPress: async () => {
          await conexoesService.remover(id);
          setConexoes((prev) => prev.filter((c) => c.id !== id));
        },
      },
    ]);
  }

  if (loading) return <ActivityIndicator className="mt-20" color="#1E3A5F" />;

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={conexoes}
        keyExtractor={(i) => String(i.id)}
        contentContainerClassName="px-4 py-4 pb-10"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} />}
        ListHeaderComponent={
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-primary">Meus Contatos</Text>
            <TouchableOpacity onPress={logout}>
              <Text className="text-red-500 text-sm font-medium">Sair</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-gray-400 text-lg">Nenhum advogado vinculado</Text>
            <Text className="text-gray-300 text-sm mt-2">Busque um advogado e solicite contato</Text>
          </View>
        }
        renderItem={({ item }) => {
          const adv = item.advogado ?? {};
          const endereco = [adv.enderecoLogradouro, adv.enderecoNumero].filter(Boolean).join(', ')
            + (adv.enderecoBairro ? ` — ${adv.enderecoBairro}` : '');
          return (
            <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
                  <Text className="text-primary text-lg font-bold">{adv.nome?.[0]}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-800">{adv.nome}</Text>
                  {adv.escritorio ? <Text className="text-gray-500 text-xs">🏢 {adv.escritorio}</Text> : null}
                  <Text className="text-secondary font-medium text-sm">{(adv.areas ?? []).join(', ') || '—'}</Text>
                  <Text className="text-gray-400 text-xs">OAB: {adv.oab}</Text>
                </View>
                <TouchableOpacity onPress={() => remover(item.id)} className="p-2">
                  <Text className="text-red-400 text-xl">×</Text>
                </TouchableOpacity>
              </View>

              {adv.bio ? <Text className="text-gray-500 text-xs mt-3">{adv.bio}</Text> : null}

              <View className="mt-3 bg-gray-50 rounded-xl p-3 gap-1">
                {adv.email ? <Text className="text-gray-600 text-xs">✉️ {adv.email}</Text> : null}
                {adv.telefone ? <Text className="text-gray-600 text-xs">📞 {adv.telefone}</Text> : null}
                {adv.whatsapp ? <Text className="text-gray-600 text-xs">💬 {adv.whatsapp}</Text> : null}
                {endereco ? (
                  <Text className="text-gray-600 text-xs">
                    📍 {endereco}
                    {adv.cidadeAtuacao && adv.estadoAtuacao ? ` · ${adv.cidadeAtuacao}/${adv.estadoAtuacao}` : ''}
                    {adv.enderecoCep ? ` · CEP ${adv.enderecoCep}` : ''}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
