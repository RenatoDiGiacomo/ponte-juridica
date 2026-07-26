import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { advogadosService } from '../../services/api';

type Dash = {
  ano: number; mes: number;
  periodo: { propostasEnviadas: number; propostasAceitas: number; taxaAceite: number; faturamentoEstimado: number; novosClientes: number };
  atual: { casosAtivos: number; clientesVinculados: number; notaMedia: number | null; totalAvaliacoes: number };
  serie: { mes: number; enviadas: number; aceitas: number }[];
};

const MESES = ['Ano inteiro', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MES_ABREV = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const COR_ENVIADAS = '#2563eb';
const COR_ACEITAS = '#d97706';
const ANO_ATUAL = new Date().getFullYear();
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function Kpi({ icone, valor, label }: { icone: string; valor: string | number; label: string }) {
  return (
    <View className="mb-3 w-[48%] rounded-2xl bg-white p-4 shadow-sm">
      <Text className="mb-1 text-xl">{icone}</Text>
      <Text className="text-xl font-extrabold text-slate-800">{valor}</Text>
      <Text className="mt-0.5 text-xs text-slate-500">{label}</Text>
    </View>
  );
}

export function DashboardAdvogadoScreen() {
  const [d, setD] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ano, setAno] = useState(ANO_ATUAL);
  const [mes, setMes] = useState(0);

  async function carregar() {
    try {
      const { data } = await advogadosService.dashboard(ano, mes || undefined);
      setD(data as Dash);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { setLoading(true); carregar(); }, [ano, mes]);

  const max = d ? Math.max(1, ...d.serie.map((s) => Math.max(s.enviadas, s.aceitas))) : 1;
  const MAXH = 110;

  return (
    <View className="flex-1 bg-background">
      {/* Hero com navegação de período */}
      <View className="bg-primary px-4 pb-4 pt-3">
        <Text className="text-sm text-blue-200">{mes ? `${MESES[mes]} de ${ano}` : `Ano de ${ano}`}</Text>
        <View className="mt-2 flex-row gap-2">
          <View className="flex-row items-center rounded-xl bg-white/10 p-1">
            <TouchableOpacity onPress={() => setAno((v) => v - 1)} className="px-2 py-1"><Ionicons name="chevron-back" size={16} color="#fff" /></TouchableOpacity>
            <Text className="min-w-12 text-center text-sm font-bold text-white">{ano}</Text>
            <TouchableOpacity onPress={() => setAno((v) => Math.min(ANO_ATUAL, v + 1))} disabled={ano >= ANO_ATUAL} className="px-2 py-1"><Ionicons name="chevron-forward" size={16} color={ano >= ANO_ATUAL ? '#7e9bbd' : '#fff'} /></TouchableOpacity>
          </View>
          <View className="flex-1 flex-row items-center justify-center rounded-xl bg-white/10 p-1">
            <TouchableOpacity onPress={() => setMes((v) => Math.max(0, v - 1))} className="px-2 py-1"><Ionicons name="chevron-back" size={16} color="#fff" /></TouchableOpacity>
            <Text className="flex-1 text-center text-sm font-bold text-white">{MESES[mes]}</Text>
            <TouchableOpacity onPress={() => setMes((v) => Math.min(12, v + 1))} className="px-2 py-1"><Ionicons name="chevron-forward" size={16} color="#fff" /></TouchableOpacity>
          </View>
        </View>
      </View>

      {loading || !d ? (
        <ActivityIndicator className="mt-16" size="large" color="#1a3a5c" />
      ) : (
        <ScrollView
          contentContainerClassName="p-4 pb-10"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} />}
        >
          <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">No período selecionado</Text>
          <View className="flex-row flex-wrap justify-between">
            <Kpi icone="📩" valor={d.periodo.propostasEnviadas} label="Propostas enviadas" />
            <Kpi icone="✅" valor={d.periodo.propostasAceitas} label="Propostas aceitas" />
            <Kpi icone="📈" valor={`${d.periodo.taxaAceite}%`} label="Taxa de aceite" />
            <Kpi icone="💰" valor={brl(d.periodo.faturamentoEstimado)} label="Faturamento estimado" />
            <Kpi icone="🤝" valor={d.periodo.novosClientes} label="Novos clientes" />
          </View>

          {/* Gráfico mensal (barras em Views) */}
          <View className="mt-2 rounded-2xl bg-white p-4 shadow-sm">
            <Text className="mb-3 text-sm font-bold text-slate-700">Propostas por mês — {ano}</Text>
            <View className="flex-row items-end justify-between" style={{ height: MAXH + 18 }}>
              {d.serie.map((s, i) => {
                const selecionado = mes === 0 || mes === s.mes;
                const op = selecionado ? 1 : 0.3;
                return (
                  <TouchableOpacity key={s.mes} onPress={() => setMes(mes === s.mes ? 0 : s.mes)} className="flex-1 items-center">
                    <View className="flex-row items-end gap-0.5" style={{ height: MAXH }}>
                      <View style={{ height: Math.max(2, (s.enviadas / max) * MAXH), width: 5, backgroundColor: COR_ENVIADAS, opacity: op, borderRadius: 2 }} />
                      <View style={{ height: Math.max(2, (s.aceitas / max) * MAXH), width: 5, backgroundColor: COR_ACEITAS, opacity: op, borderRadius: 2 }} />
                    </View>
                    <Text className={`mt-1 text-[9px] ${mes === s.mes ? 'font-bold text-primary' : 'text-slate-400'}`}>{MES_ABREV[i]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View className="mt-3 flex-row items-center gap-4">
              <View className="flex-row items-center gap-1.5"><View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: COR_ENVIADAS }} /><Text className="text-xs text-slate-500">Enviadas</Text></View>
              <View className="flex-row items-center gap-1.5"><View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: COR_ACEITAS }} /><Text className="text-xs text-slate-500">Aceitas</Text></View>
              {mes > 0 && <TouchableOpacity onPress={() => setMes(0)} className="ml-auto"><Text className="text-xs font-semibold text-primary">Ver ano inteiro</Text></TouchableOpacity>}
            </View>
          </View>

          <Text className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Situação atual</Text>
          <View className="flex-row flex-wrap justify-between">
            <Kpi icone="⚖️" valor={d.atual.casosAtivos} label="Casos em atendimento" />
            <Kpi icone="👥" valor={d.atual.clientesVinculados} label="Clientes vinculados" />
            <Kpi icone="⭐" valor={d.atual.notaMedia != null ? d.atual.notaMedia.toFixed(1) : '—'} label={`Nota média (${d.atual.totalAvaliacoes})`} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}
