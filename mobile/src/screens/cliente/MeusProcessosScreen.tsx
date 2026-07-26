import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { processosService } from '../../services/api';
import { StatusBadge, type CasoStatus } from '../../components/StatusBadge';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EmptyState } from '../../components/EmptyState';

type Proposta = {
  id: number;
  mensagem: string;
  valorEstimado: string;
  status: 'pendente' | 'aceita' | 'recusada' | 'cancelada';
  justificativa?: string | null;
  advogado: { id: number; nome: string; oab: string };
};
type Processo = {
  id: number;
  titulo: string;
  descricao: string;
  especializacao: string;
  status: CasoStatus;
  dataCriacao: string;
  propostas: Proposta[];
};

const FILTROS: { label: string; valor: CasoStatus | 'todos' }[] = [
  { label: 'Todos', valor: 'todos' },
  { label: 'Aberto', valor: 'aberto' },
  { label: 'Em atendimento', valor: 'em_atendimento' },
  { label: 'Encerrado', valor: 'encerrado' },
];

function menorValor(p: Processo): number {
  if (!p.propostas.length) return Number.POSITIVE_INFINITY;
  return Math.min(...p.propostas.map((pr) => Number(pr.valorEstimado)));
}

// Ordem de exibição das propostas: aceita no topo, recusadas/canceladas por último.
const PRIO_PROPOSTA: Record<Proposta['status'], number> = { aceita: 0, pendente: 1, recusada: 2, cancelada: 3 };
const ordenarPropostas = (props: Proposta[]) => [...props].sort((a, b) => PRIO_PROPOSTA[a.status] - PRIO_PROPOSTA[b.status]);

export function MeusProcessosScreen({ navigation }: any) {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<CasoStatus | 'todos'>('aberto');
  const [ordem, setOrdem] = useState<'' | 'asc' | 'desc'>('');
  const [confirmar, setConfirmar] = useState<Proposta | null>(null);
  const [aceitando, setAceitando] = useState(false);
  const [expandidas, setExpandidas] = useState<Set<number>>(new Set()); // casos com o grupo de recusadas aberto

  const toggleRecusadas = (casoId: number) =>
    setExpandidas((prev) => {
      const novo = new Set(prev);
      novo.has(casoId) ? novo.delete(casoId) : novo.add(casoId);
      return novo;
    });

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

  useFocusEffect(useCallback(() => { carregar(); }, []));

  const filtrados = useMemo(() => {
    let lista = filtro === 'todos' ? processos : processos.filter((p) => p.status === filtro);
    if (ordem) lista = [...lista].sort((a, b) => (ordem === 'asc' ? menorValor(a) - menorValor(b) : menorValor(b) - menorValor(a)));
    return lista;
  }, [processos, filtro, ordem]);

  async function confirmarAceite() {
    if (!confirmar) return;
    setAceitando(true);
    try {
      await processosService.aceitarProposta(confirmar.id);
      setConfirmar(null);
      await carregar();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao aceitar');
    } finally {
      setAceitando(false);
    }
  }

  async function recusarProposta(p: Proposta) {
    try {
      await processosService.recusarProposta(p.id);
      carregar();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao recusar');
    }
  }

  const cicloOrdem = () => setOrdem((o) => (o === '' ? 'asc' : o === 'asc' ? 'desc' : ''));

  const cardProposta = (p: Proposta, casoStatus: CasoStatus) => {
    const cor = p.status === 'aceita' ? 'border-emerald-200 bg-emerald-50'
      : p.status === 'recusada' ? 'border-red-100 bg-red-50/60'
      : p.status === 'cancelada' ? 'border-slate-200 bg-slate-50'
      : 'border-slate-100 bg-slate-50';
    return (
      <View key={p.id} className={`mb-2 rounded-xl border p-3 ${cor}`}>
        <View className="flex-row justify-between">
          <Text className="font-bold text-slate-800">{p.advogado.nome}</Text>
          <Text className="font-bold text-secondary">R$ {Number(p.valorEstimado).toFixed(2)}</Text>
        </View>
        <Text className="mb-1 text-xs text-slate-400">OAB {p.advogado.oab}</Text>
        <Text className="text-sm text-slate-600">{p.mensagem}</Text>

        {p.status === 'pendente' && casoStatus === 'aberto' && (
          <View className="mt-2 flex-row gap-2">
            <TouchableOpacity onPress={() => setConfirmar(p)} className="flex-1 items-center rounded-lg bg-primary py-2">
              <Text className="font-bold text-white">✓ Aceitar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => recusarProposta(p)} className="flex-1 items-center rounded-lg border border-slate-200 bg-white py-2">
              <Text className="font-medium text-slate-600">Recusar</Text>
            </TouchableOpacity>
          </View>
        )}
        {p.status === 'aceita' && <Text className="mt-2 text-sm font-bold text-emerald-700">✓ Proposta aceita</Text>}
        {p.status === 'recusada' && <Text className="mt-2 text-sm font-semibold text-erro">✕ Recusada</Text>}
        {p.status === 'cancelada' && (
          <View className="mt-2">
            <Text className="text-sm font-semibold text-slate-500">✕ Cancelada pelo advogado</Text>
            {p.justificativa ? <Text className="mt-0.5 text-xs text-slate-500">Motivo: {p.justificativa}</Text> : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Hero */}
      <View className="bg-primary px-5 pb-4 pt-3">
        <Text className="text-blue-200 text-sm">
          {loading ? '...' : `${processos.length} ${processos.length === 1 ? 'caso publicado' : 'casos publicados'}`}
        </Text>
        {/* Filtros + ordenação */}
        <View className="mt-3 flex-row items-center">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
            <View className="flex-row gap-2 pr-2">
              {FILTROS.map((f) => {
                const ativo = filtro === f.valor;
                return (
                  <TouchableOpacity key={f.valor} onPress={() => setFiltro(f.valor)} className={`rounded-full px-3 py-1.5 ${ativo ? 'bg-white' : 'bg-white/10 border border-white/20'}`}>
                    <Text className={`text-xs font-semibold ${ativo ? 'text-primary' : 'text-blue-100'}`}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          <TouchableOpacity onPress={cicloOrdem} className={`ml-2 rounded-full px-3 py-1.5 ${ordem ? 'bg-secondary' : 'bg-white/10 border border-white/20'}`}>
            <Text className={`text-xs font-bold ${ordem ? 'text-primary' : 'text-blue-100'}`}>
              {ordem === 'asc' ? 'Valor ↑' : ordem === 'desc' ? 'Valor ↓' : 'Ordenar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator className="mt-20" size="large" color="#1a3a5c" />
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(i) => String(i.id)}
          contentContainerClassName="px-4 py-4 pb-24"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} />}
          ListEmptyComponent={
            <EmptyState
              icone="📝"
              titulo={processos.length === 0 ? 'Nenhum caso publicado' : 'Nenhum caso neste filtro'}
              descricao={processos.length === 0 ? 'Toque no botão "+" para publicar seu primeiro caso.' : 'Tente outro filtro.'}
            />
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
              <View className="mb-1 flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-base font-bold text-slate-800" numberOfLines={2}>{item.titulo}</Text>
                <StatusBadge status={item.status} />
              </View>
              <View className="mb-2 self-start rounded-full bg-primary/10 px-2 py-0.5">
                <Text className="text-xs font-semibold text-primary">{item.especializacao}</Text>
              </View>
              <Text className="text-sm text-slate-600" numberOfLines={3}>{item.descricao}</Text>

              {item.propostas.length > 0 && (() => {
                const ativas = ordenarPropostas(item.propostas.filter((p) => p.status === 'aceita' || p.status === 'pendente'));
                const recusadas = item.propostas.filter((p) => p.status === 'recusada' || p.status === 'cancelada');
                const aberto = expandidas.has(item.id);
                return (
                  <View className="mt-3 border-t border-slate-100 pt-3">
                    <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Propostas recebidas ({item.propostas.length})
                    </Text>
                    {ativas.map((p) => cardProposta(p, item.status))}
                    {ativas.length === 0 && recusadas.length > 0 && (
                      <Text className="mb-2 text-sm text-slate-400">Nenhuma proposta ativa.</Text>
                    )}
                    {recusadas.length > 0 && (
                      <View>
                        <TouchableOpacity onPress={() => toggleRecusadas(item.id)} className="flex-row items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                          <Text className="text-sm font-semibold text-slate-600">Recusadas / canceladas ({recusadas.length})</Text>
                          <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={16} color="#64748b" />
                        </TouchableOpacity>
                        {aberto && <View className="mt-2">{recusadas.map((p) => cardProposta(p, item.status))}</View>}
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
          )}
        />
      )}

      {/* FAB publicar caso (azul, glifo centralizado) */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CriarProcesso')}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
        accessibilityLabel="Publicar novo caso"
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <ConfirmModal
        aberto={confirmar !== null}
        titulo="Aceitar proposta"
        mensagem={confirmar ? `Aceitar a proposta de ${confirmar.advogado.nome} por R$ ${Number(confirmar.valorEstimado).toFixed(2)}? O caso passa para "Em atendimento".` : ''}
        textoConfirmar="Aceitar"
        carregando={aceitando}
        onConfirmar={confirmarAceite}
        onCancelar={() => setConfirmar(null)}
      />
    </View>
  );
}
