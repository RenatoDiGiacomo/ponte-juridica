import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { conexoesService } from '../../services/api';

export function ClientesAdvogadoScreen() {
  const [conexoes, setConexoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading) return <ActivityIndicator className="mt-20" color="#1E3A5F" />;

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={conexoes}
        keyExtractor={(i) => String(i.id)}
        contentContainerClassName="px-4 py-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} />}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-gray-400 text-lg">Nenhum cliente ainda</Text>
            <Text className="text-gray-300 text-sm mt-2">Clientes aparecerão aqui quando solicitarem contato</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
              <Text className="text-primary text-lg font-bold">{item.cliente?.nome?.[0]}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-800">{item.cliente?.nome}</Text>
              <Text className="text-gray-500 text-sm">{item.cliente?.email}</Text>
              <Text className="text-gray-400 text-xs mt-1">
                Vinculado em {new Date(item.dataVinculo).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
