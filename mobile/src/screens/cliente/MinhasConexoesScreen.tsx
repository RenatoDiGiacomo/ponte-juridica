import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { conexoesService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EmptyState } from '../../components/EmptyState';

export function MinhasConexoesScreen() {
  const [conexoes, setConexoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removerId, setRemoverId] = useState<number | null>(null);
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

  async function confirmarRemocao() {
    if (removerId === null) return;
    const id = removerId;
    setRemoverId(null);
    try {
      await conexoesService.remover(id);
      setConexoes((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao remover');
    }
  }

  if (loading) return <ActivityIndicator className="mt-20" color="#1a3a5c" />;

  return (
    <View className="flex-1 bg-background">
      {/* Hero */}
      <View className="flex-row items-center justify-between bg-primary px-5 pb-4 pt-3">
        <Text className="text-blue-200 text-sm">
          {conexoes.length} {conexoes.length === 1 ? 'advogado' : 'advogados'}
        </Text>
        <TouchableOpacity onPress={logout}><Text className="text-sm font-medium text-blue-100">Sair</Text></TouchableOpacity>
      </View>

      <FlatList
        data={conexoes}
        keyExtractor={(i) => String(i.id)}
        contentContainerClassName="px-4 py-4 pb-10"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} />}
        ListEmptyComponent={
          <EmptyState icone="⚖️" titulo="Nenhum advogado vinculado" descricao="Busque um advogado e solicite contato." />
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
                <TouchableOpacity onPress={() => setRemoverId(item.id)} className="p-2">
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

      <ConfirmModal
        aberto={removerId !== null}
        titulo="Remover vínculo"
        mensagem="Deseja remover este advogado dos seus contatos?"
        textoConfirmar="Remover"
        destrutivo
        onConfirmar={confirmarRemocao}
        onCancelar={() => setRemoverId(null)}
      />
    </View>
  );
}
