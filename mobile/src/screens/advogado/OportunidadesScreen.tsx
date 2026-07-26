import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { processosService } from '../../services/api';

type ProcessoAberto = {
  id: number;
  titulo: string;
  descricao: string;
  especializacao: string;
  dataCriacao: string;
  cliente: { id: number; nome: string };
  _count: { propostas: number };
};

const ESPECIALIZACOES = [
  'Minha área',
  'Criminal',
  'Trabalhista',
  'Família',
  'Cível',
  'Tributário',
  'Previdenciário',
];

type Quota = {
  plano: string;
  limite: number | null;
  usadas: number;
  restantes: number | null;
};

export function OportunidadesScreen({ navigation }: any) {
  const [processos, setProcessos] = useState<ProcessoAberto[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [filtro, setFiltro] = useState('Minha área');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function carregar() {
    try {
      const area = filtro === 'Minha área' ? undefined : filtro;
      const [{ data: lista }, { data: q }] = await Promise.all([
        processosService.abertos({ ...(area && { area }), page: 1, pageSize: 100 }),
        processosService.quota(),
      ]);
      setProcessos(lista.data ?? lista);
      setQuota(q);
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao carregar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [filtro]),
  );

  const quotaCor =
    !quota || quota.limite === null
      ? 'bg-green-50 border-green-200'
      : quota.restantes === 0
      ? 'bg-red-50 border-red-200'
      : (quota.restantes ?? 0) <= 2
      ? 'bg-amber-50 border-amber-200'
      : 'bg-blue-50 border-blue-200';

  return (
    <View className="flex-1 bg-background">
      {/* Hero com filtros de área */}
      <View className="bg-primary px-4 pb-4 pt-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pr-2">
            {ESPECIALIZACOES.map((item) => {
              const ativo = filtro === item;
              return (
                <TouchableOpacity key={item} onPress={() => setFiltro(item)} className={`rounded-full px-3 py-1.5 ${ativo ? 'bg-white' : 'bg-white/10 border border-white/20'}`}>
                  <Text className={`text-xs font-semibold ${ativo ? 'text-primary' : 'text-blue-100'}`}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {quota && (
        <View className={`mx-4 mt-3 p-3 rounded-xl border ${quotaCor}`}>
          <Text className="text-xs text-gray-500 font-medium">Plano {quota.plano}</Text>
          <Text className="text-sm text-primary font-semibold">
            {quota.limite === null
              ? `${quota.usadas} propostas neste mês · ilimitado`
              : `${quota.usadas} / ${quota.limite} propostas usadas neste mês`}
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator className="mt-10" color="#1a3a5c" />
      ) : (
        <FlatList
          data={processos}
          keyExtractor={(i) => String(i.id)}
          contentContainerClassName="px-4 pb-6"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                carregar();
              }}
            />
          }
          ListEmptyComponent={
            <View className="items-center mt-20 px-6">
              <Text className="text-gray-500 text-center text-base">
                Nenhum caso aberto na área selecionada no momento.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('EnviarProposta', { processo: item })}
              className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
            >
              <Text className="text-lg font-bold text-primary" numberOfLines={2}>
                {item.titulo}
              </Text>
              <Text className="text-secondary font-medium text-sm">{item.especializacao}</Text>
              <Text className="text-gray-600 text-sm mt-2" numberOfLines={3}>
                {item.descricao}
              </Text>
              <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-gray-100">
                <Text className="text-xs text-gray-500">por {item.cliente.nome}</Text>
                <Text className="text-xs text-gray-500">
                  {item._count.propostas} proposta{item._count.propostas === 1 ? '' : 's'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
