import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { processosService } from '../../services/api';

type Proposta = {
  id: number;
  mensagem: string;
  valorEstimado: string;
  status: 'pendente' | 'aceita' | 'recusada';
  advogado: { id: number; nome: string; especializacao: string; oab: string };
};

type Processo = {
  id: number;
  titulo: string;
  descricao: string;
  especializacao: string;
  status: 'aberto' | 'em_atendimento' | 'encerrado';
  dataCriacao: string;
  propostas: Proposta[];
};

const STATUS_COR: Record<Processo['status'], string> = {
  aberto: 'bg-blue-100 text-blue-700',
  em_atendimento: 'bg-green-100 text-green-700',
  encerrado: 'bg-gray-200 text-gray-600',
};
const STATUS_LABEL: Record<Processo['status'], string> = {
  aberto: 'Aberto',
  em_atendimento: 'Em atendimento',
  encerrado: 'Encerrado',
};

export function MeusProcessosScreen({ navigation }: any) {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function carregar() {
    try {
      const { data } = await processosService.meus();
      setProcessos(data);
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao carregar processos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, []),
  );

  async function aceitarProposta(p: Proposta) {
    Alert.alert(
      'Aceitar proposta',
      `Aceitar a proposta de ${p.advogado.nome} por R$ ${Number(p.valorEstimado).toFixed(2)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceitar',
          onPress: async () => {
            try {
              await processosService.aceitarProposta(p.id);
              Alert.alert('Sucesso', 'Proposta aceita! O advogado já está vinculado a você.');
              carregar();
            } catch (e: any) {
              Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao aceitar');
            }
          },
        },
      ],
    );
  }

  async function recusarProposta(p: Proposta) {
    try {
      await processosService.recusarProposta(p.id);
      carregar();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao recusar');
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={processos}
        keyExtractor={(i) => String(i.id)}
        contentContainerClassName="px-4 py-4 pb-24"
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
              Você ainda não publicou nenhum caso. Toque no botão "+" para criar.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <View className="flex-row justify-between items-start mb-1">
              <Text className="text-lg font-bold text-primary flex-1 pr-2" numberOfLines={2}>
                {item.titulo}
              </Text>
              <View className={`px-2 py-1 rounded-full ${STATUS_COR[item.status].split(' ')[0]}`}>
                <Text className={`text-xs font-semibold ${STATUS_COR[item.status].split(' ')[1]}`}>
                  {STATUS_LABEL[item.status]}
                </Text>
              </View>
            </View>
            <Text className="text-secondary font-medium text-sm">{item.especializacao}</Text>
            <Text className="text-gray-600 text-sm mt-2" numberOfLines={3}>
              {item.descricao}
            </Text>

            {item.propostas.length > 0 && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-700 font-semibold mb-2">
                  Propostas recebidas ({item.propostas.length})
                </Text>
                {item.propostas.map((p) => (
                  <View key={p.id} className="bg-gray-50 rounded-xl p-3 mb-2">
                    <View className="flex-row justify-between">
                      <Text className="font-semibold text-primary">{p.advogado.nome}</Text>
                      <Text className="font-bold text-secondary">
                        R$ {Number(p.valorEstimado).toFixed(2)}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500 mb-1">
                      OAB {p.advogado.oab} · {p.advogado.especializacao}
                    </Text>
                    <Text className="text-gray-700 text-sm">{p.mensagem}</Text>

                    {p.status === 'pendente' && item.status === 'aberto' && (
                      <View className="flex-row gap-2 mt-2">
                        <TouchableOpacity
                          onPress={() => aceitarProposta(p)}
                          className="flex-1 bg-primary py-2 rounded-lg items-center"
                        >
                          <Text className="text-white font-medium">Aceitar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => recusarProposta(p)}
                          className="flex-1 bg-white border border-gray-300 py-2 rounded-lg items-center"
                        >
                          <Text className="text-gray-600 font-medium">Recusar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {p.status === 'aceita' && (
                      <Text className="mt-2 text-green-700 font-semibold text-sm">
                        ✓ Aceita
                      </Text>
                    )}
                    {p.status === 'recusada' && (
                      <Text className="mt-2 text-gray-500 text-sm">Recusada</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('CriarProcesso')}
        className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-white text-3xl leading-7">+</Text>
      </TouchableOpacity>
    </View>
  );
}
