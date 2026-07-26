import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, ScrollView, Alert, TextInput } from 'react-native';
import { conexoesService } from '../../services/api';

const STATUS_LABEL: Record<string, string> = {
  aberto: 'Aberto',
  em_atendimento: 'Em atendimento',
  encerrado: 'Encerrado',
};

export function ClientesAdvogadoScreen() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detalhe, setDetalhe] = useState<any>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { data } = await conexoesService.meusClientes({ ...(busca && { busca }), page: 1, pageSize: 100 });
      setClientes(data.data ?? data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [busca]);

  useEffect(() => {
    const t = setTimeout(carregar, 350);
    return () => clearTimeout(t);
  }, [carregar]);

  async function abrirDetalhe(clienteId: number) {
    setDetalhe(null);
    setCarregandoDetalhe(true);
    try {
      const { data } = await conexoesService.detalheCliente(clienteId);
      setDetalhe(data);
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao carregar dados do cliente');
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      {/* Hero com busca */}
      <View className="bg-primary px-4 pb-4 pt-3">
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="🔍 Buscar cliente por nome ou CPF/CNPJ..."
          placeholderTextColor="#93b0d0"
          className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white"
        />
      </View>

      {loading ? (
        <ActivityIndicator className="mt-16" size="large" color="#1a3a5c" />
      ) : (
      <FlatList
        data={clientes}
        keyExtractor={(i) => String(i.id)}
        contentContainerClassName="px-4 py-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} />}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-gray-400 text-lg">Nenhum cliente ainda</Text>
            <Text className="text-gray-300 text-sm mt-2">Clientes aparecem quando uma proposta sua é aceita</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => abrirDetalhe(item.cliente?.id)} className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex-row items-center">
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
            <Text className="text-primary font-bold text-lg">›</Text>
          </TouchableOpacity>
        )}
      />
      )}

      {/* Modal de detalhe do cliente */}
      <Modal visible={carregandoDetalhe || detalhe !== null} animationType="slide" transparent onRequestClose={() => setDetalhe(null)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-background rounded-t-3xl max-h-[85%] p-6">
            {carregandoDetalhe || !detalhe ? (
              <ActivityIndicator className="my-10" color="#1E3A5F" />
            ) : (
              <ScrollView>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-primary">{detalhe.nome}</Text>
                  <TouchableOpacity onPress={() => setDetalhe(null)}><Text className="text-gray-400 text-2xl">×</Text></TouchableOpacity>
                </View>

                <View className="bg-white rounded-xl p-4 gap-1">
                  <Text className="text-gray-600 text-sm">✉️ {detalhe.email}</Text>
                  {detalhe.telefone ? <Text className="text-gray-600 text-sm">📞 {detalhe.telefone}</Text> : null}
                  {(detalhe.enderecoCidade || detalhe.enderecoEstado) ? (
                    <Text className="text-gray-600 text-sm">📍 {[detalhe.enderecoCidade, detalhe.enderecoEstado].filter(Boolean).join('/')}</Text>
                  ) : null}
                  <Text className="text-gray-400 text-xs mt-1">
                    Cliente desde {new Date(detalhe.dataCadastro).toLocaleDateString('pt-BR')} · vinculado desde {new Date(detalhe.vinculadoDesde).toLocaleDateString('pt-BR')}
                  </Text>
                </View>

                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-5 mb-2">
                  Casos com você ({detalhe.casos?.length ?? 0})
                </Text>
                {(detalhe.casos ?? []).length === 0 ? (
                  <Text className="text-gray-400 text-sm">Nenhum caso compartilhado.</Text>
                ) : (
                  detalhe.casos.map((c: any) => (
                    <View key={c.id} className="bg-white rounded-xl p-3 mb-2">
                      <Text className="font-semibold text-gray-800">{c.titulo}</Text>
                      <View className="flex-row flex-wrap gap-x-2 mt-1">
                        <Text className="text-primary text-xs font-semibold">{c.especializacao}</Text>
                        <Text className="text-gray-400 text-xs">{STATUS_LABEL[c.status] ?? c.status}</Text>
                        {c.minhaProposta ? <Text className="text-gray-400 text-xs">· R$ {Number(c.minhaProposta.valorEstimado).toFixed(2)} ({c.minhaProposta.status})</Text> : null}
                      </View>
                    </View>
                  ))
                )}

                <TouchableOpacity onPress={() => setDetalhe(null)} className="bg-gray-100 py-3 rounded-xl items-center mt-4">
                  <Text className="text-gray-600 font-medium">Fechar</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
