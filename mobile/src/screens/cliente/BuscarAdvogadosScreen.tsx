import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { advogadosService, conexoesService } from '../../services/api';
import { EmptyState } from '../../components/EmptyState';

const AREAS = ['Todos', 'Criminal', 'Trabalhista', 'Família', 'Cível', 'Tributário', 'Previdenciário'];

export function BuscarAdvogadosScreen() {
  const [advogados, setAdvogados] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [conectados, setConectados] = useState<Set<number>>(new Set());
  const [conectando, setConectando] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(buscar, 350);
    return () => clearTimeout(t);
  }, [filtro, busca]);

  async function buscar() {
    setLoading(true);
    try {
      const area = filtro === 'Todos' ? undefined : filtro;
      const { data } = await advogadosService.buscar({
        vinculo: 'nao',
        ...(busca && { busca }),
        ...(area && { area }),
        page: 1,
        pageSize: 50,
      });
      setAdvogados(data.data ?? data);
    } finally {
      setLoading(false);
    }
  }

  async function conectar(advogadoId: number) {
    setConectando(advogadoId);
    try {
      await conexoesService.conectar(advogadoId);
      setConectados((prev) => new Set(prev).add(advogadoId));
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Erro ao solicitar contato');
    } finally {
      setConectando(null);
    }
  }

  const PLANO_COR: Record<string, string> = {
    Básico: 'bg-slate-100 text-slate-600',
    Profissional: 'bg-blue-100 text-blue-700',
    Elite: 'bg-amber-100 text-amber-700',
  };

  return (
    <View className="flex-1 bg-background">
      {/* Hero com busca + filtros */}
      <View className="bg-primary px-5 pb-4 pt-3">
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="🔍 Buscar por nome do advogado..."
          placeholderTextColor="#93b0d0"
          className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          <View className="flex-row gap-2 pr-2">
            {AREAS.map((item) => {
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

      {loading ? (
        <ActivityIndicator className="mt-16" size="large" color="#1a3a5c" />
      ) : (
        <FlatList
          data={advogados}
          keyExtractor={(i) => String(i.id)}
          contentContainerClassName="px-4 py-4 pb-6"
          ListEmptyComponent={<EmptyState icone="🔍" titulo="Nenhum advogado encontrado" descricao="Tente outro nome ou área." />}
          renderItem={({ item }) => {
            const conectado = conectados.has(item.id);
            const planoCor = PLANO_COR[item.plano?.nome] ?? PLANO_COR['Básico'];
            const ini = (item.nome ?? '?').split(' ').filter(Boolean).map((n: string) => n[0]).slice(0, 2).join('');
            return (
              <View className="mb-3 overflow-hidden rounded-2xl bg-white shadow-sm">
                <View className="h-1.5 bg-primary" />
                <View className="p-4">
                  <View className="flex-row items-start gap-3">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
                      <Text className="text-base font-black text-white">{ini}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-start justify-between gap-2">
                        <Text className="flex-1 text-base font-bold text-slate-800">{item.nome}</Text>
                        {item.plano?.nome ? (
                          <View className={`rounded-full px-2 py-0.5 ${planoCor.split(' ')[0]}`}>
                            <Text className={`text-xs font-bold ${planoCor.split(' ')[1]}`}>{item.plano.nome}</Text>
                          </View>
                        ) : null}
                      </View>
                      {item.escritorio ? <Text className="text-xs text-slate-400">🏢 {item.escritorio}</Text> : null}
                      <Text className="text-sm font-medium text-secondary">{(item.areas ?? []).join(', ') || '—'}</Text>
                    </View>
                  </View>
                  <View className="mt-3 flex-row flex-wrap gap-x-3 gap-y-1">
                    <Text className="text-xs text-slate-500">OAB {item.oab}</Text>
                    <Text className="text-xs font-bold text-secondary">★ {item.nota ?? '—'}</Text>
                    {item.cidadeAtuacao ? <Text className="text-xs text-slate-500">📍 {item.cidadeAtuacao}{item.estadoAtuacao ? `/${item.estadoAtuacao}` : ''}</Text> : null}
                  </View>
                  {item.bio ? <Text className="mt-2 text-xs text-slate-500" numberOfLines={2}>{item.bio}</Text> : null}
                  <TouchableOpacity
                    onPress={() => conectar(item.id)}
                    disabled={conectado || conectando === item.id}
                    className={`mt-3 items-center rounded-xl py-2.5 ${conectado ? 'bg-emerald-500' : 'bg-primary'}`}
                  >
                    <Text className="font-bold text-white">
                      {conectando === item.id ? 'Solicitando...' : conectado ? '✓ Contato solicitado' : 'Solicitar contato'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
