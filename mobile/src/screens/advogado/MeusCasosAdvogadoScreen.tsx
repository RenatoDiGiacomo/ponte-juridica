import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Modal, ScrollView, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { processosService } from '../../services/api';

const STATUS: Record<string, { label: string; cls: string }> = {
  aberto: { label: 'Aberto', cls: 'bg-blue-100 text-blue-700' },
  em_atendimento: { label: 'Em atendimento', cls: 'bg-green-100 text-green-700' },
  encerrado: { label: 'Encerrado', cls: 'bg-gray-200 text-gray-600' },
};

const FILTROS = [
  { label: 'Todos', v: 'todos' },
  { label: 'Aberto', v: 'aberto' },
  { label: 'Em atendimento', v: 'em_atendimento' },
  { label: 'Encerrado', v: 'encerrado' },
];

export function MeusCasosAdvogadoScreen() {
  const [casos, setCasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState('aberto');
  const [selId, setSelId] = useState<number | null>(null);
  const [texto, setTexto] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editTexto, setEditTexto] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mostrarEncerrar, setMostrarEncerrar] = useState(false);
  const [justificativaEnc, setJustificativaEnc] = useState('');
  const [encerrando, setEncerrando] = useState(false);

  async function encerrarCaso() {
    if (!sel) return;
    if (justificativaEnc.trim().length < 5) return Alert.alert('Atenção', 'Informe uma justificativa (mín. 5 caracteres)');
    setEncerrando(true);
    try {
      await processosService.encerrar(sel.id, justificativaEnc.trim());
      setMostrarEncerrar(false);
      setJustificativaEnc('');
      await carregar();
      Alert.alert('Pronto', 'Caso encerrado.');
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao encerrar');
    } finally {
      setEncerrando(false);
    }
  }

  const carregar = useCallback(async () => {
    try {
      const { data } = await processosService.meusCasosAdvogado();
      setCasos(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const filtrados = filtro === 'todos' ? casos : casos.filter((c) => c.status === filtro);
  const sel = casos.find((c) => c.id === selId) ?? null;
  const minhaProposta = sel?.propostas?.[0];
  const souResponsavel = minhaProposta?.status === 'aceita';

  function fechar() {
    setSelId(null);
    setTexto('');
    setEditId(null);
    setEditTexto('');
    setMostrarEncerrar(false);
    setJustificativaEnc('');
  }

  async function adicionar() {
    if (!sel || texto.trim().length < 3) return;
    setSalvando(true);
    try {
      await processosService.adicionarRelatorio(sel.id, texto.trim());
      setTexto('');
      await carregar();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao registrar');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEdicao() {
    if (editId === null || editTexto.trim().length < 3) return;
    setSalvando(true);
    try {
      await processosService.editarRelatorio(editId, editTexto.trim());
      setEditId(null);
      setEditTexto('');
      await carregar();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao atualizar');
    } finally {
      setSalvando(false);
    }
  }

  function excluir(id: number) {
    Alert.alert('Excluir relatório', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          try {
            await processosService.removerRelatorio(id);
            await carregar();
          } catch (e: any) {
            Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao excluir');
          }
        },
      },
    ]);
  }

  // recupera o caso selecionado atualizado após recarregar
  const selAtual = casos.find((c) => c.id === selId) ?? sel;

  if (loading) return <ActivityIndicator className="mt-20" color="#1a3a5c" />;

  return (
    <View className="flex-1 bg-background">
      {/* Hero com filtros de status */}
      <View className="bg-primary px-4 pb-4 pt-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pr-2">
            {FILTROS.map((f) => {
              const ativo = filtro === f.v;
              return (
                <TouchableOpacity key={f.v} onPress={() => setFiltro(f.v)} className={`rounded-full px-3 py-1.5 ${ativo ? 'bg-white' : 'bg-white/10 border border-white/20'}`}>
                  <Text className={`text-xs font-semibold ${ativo ? 'text-primary' : 'text-blue-100'}`}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={filtrados}
        keyExtractor={(i) => String(i.id)}
        contentContainerClassName="px-4 pb-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} />}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-gray-400 text-lg">Nenhum caso</Text>
            <Text className="text-gray-300 text-sm mt-2">Envie propostas em Oportunidades para começar a atuar</Text>
          </View>
        }
        renderItem={({ item }) => {
          const st = STATUS[item.status] ?? { label: item.status, cls: 'bg-gray-100 text-gray-600' };
          return (
            <TouchableOpacity onPress={() => setSelId(item.id)} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row justify-between items-start">
                <Text className="text-base font-bold text-primary flex-1 pr-2" numberOfLines={2}>{item.titulo}</Text>
                <View className={`px-2 py-0.5 rounded-full ${st.cls}`}><Text className="text-xs font-medium">{st.label}</Text></View>
              </View>
              <Text className="text-gray-500 text-sm mt-1">Cliente: {item.cliente?.nome}</Text>
              <Text className="text-gray-400 text-xs mt-1">
                {item.relatorios?.length ?? 0} relatório{(item.relatorios?.length ?? 0) === 1 ? '' : 's'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Modal do caso + relatórios */}
      <Modal visible={selId !== null} animationType="slide" transparent onRequestClose={fechar}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-background rounded-t-3xl max-h-[88%] p-6">
            {selAtual && (
              <ScrollView>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xl font-bold text-primary flex-1 pr-2">{selAtual.titulo}</Text>
                  <TouchableOpacity onPress={fechar}><Text className="text-gray-400 text-2xl">×</Text></TouchableOpacity>
                </View>
                <Text className="text-gray-500 text-sm">Cliente: {selAtual.cliente?.nome}</Text>
                <Text className="text-gray-600 text-sm mt-2">{selAtual.descricao}</Text>
                {minhaProposta ? (
                  <Text className="text-gray-500 text-sm mt-2">
                    Minha proposta: R$ {Number(minhaProposta.valorEstimado).toFixed(2)} · {minhaProposta.status}
                  </Text>
                ) : null}

                {/* Encerrar caso (responsável, ainda não encerrado) */}
                {souResponsavel && selAtual.status !== 'encerrado' && (
                  <View className="mt-3 rounded-2xl border border-red-100 bg-red-50/50 p-3">
                    {!mostrarEncerrar ? (
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-2">
                          <Text className="text-xs font-bold uppercase tracking-wider text-erro">Encerrar caso</Text>
                          <Text className="text-[11px] text-slate-500">O cliente vê a justificativa.</Text>
                        </View>
                        <TouchableOpacity onPress={() => setMostrarEncerrar(true)} className="rounded-lg border border-red-300 bg-white px-3 py-1.5">
                          <Text className="text-xs font-bold text-erro">Encerrar</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View>
                        <Text className="mb-1 text-[11px] text-slate-500">Justificativa (será exibida ao cliente):</Text>
                        <TextInput
                          value={justificativaEnc}
                          onChangeText={setJustificativaEnc}
                          placeholder="Ex.: acordo cumprido; nada mais a tratar."
                          multiline
                          textAlignVertical="top"
                          className="h-20 rounded-xl border border-red-200 bg-white p-3"
                        />
                        <View className="mt-2 flex-row gap-2">
                          <TouchableOpacity onPress={encerrarCaso} disabled={encerrando} className="flex-1 items-center rounded-lg bg-erro py-2.5">
                            {encerrando ? <ActivityIndicator color="#fff" /> : <Text className="font-bold text-white">Encerrar caso</Text>}
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => setMostrarEncerrar(false)} className="flex-1 items-center rounded-lg border border-gray-200 bg-white py-2.5">
                            <Text className="font-medium text-gray-600">Voltar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-5 mb-2">
                  Relatórios de situação ({selAtual.relatorios?.length ?? 0})
                </Text>

                {souResponsavel ? (
                  <View className="mb-3">
                    <TextInput
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 h-20"
                      value={texto}
                      onChangeText={setTexto}
                      placeholder="Registrar andamento do caso..."
                      multiline
                      textAlignVertical="top"
                    />
                    <TouchableOpacity
                      onPress={adicionar}
                      disabled={salvando || texto.trim().length < 3}
                      className={`py-2 rounded-xl items-center mt-2 ${texto.trim().length < 3 ? 'bg-gray-300' : 'bg-primary'}`}
                    >
                      <Text className="text-white font-bold">Registrar relatório</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text className="text-gray-400 text-xs mb-3">Apenas o advogado responsável (proposta aceita) registra relatórios.</Text>
                )}

                {(selAtual.relatorios ?? []).length === 0 ? (
                  <Text className="text-gray-400 text-sm">Nenhum relatório registrado.</Text>
                ) : (
                  selAtual.relatorios.map((r: any) => (
                    <View key={r.id} className="bg-white rounded-xl p-3 mb-2">
                      {editId === r.id ? (
                        <View>
                          <TextInput
                            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 h-20"
                            value={editTexto}
                            onChangeText={setEditTexto}
                            multiline
                            textAlignVertical="top"
                          />
                          <View className="flex-row gap-2 mt-2">
                            <TouchableOpacity onPress={salvarEdicao} disabled={salvando} className="bg-primary px-3 py-1.5 rounded-lg">
                              <Text className="text-white text-xs font-bold">Salvar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setEditId(null); setEditTexto(''); }} className="border border-gray-300 px-3 py-1.5 rounded-lg">
                              <Text className="text-gray-600 text-xs">Cancelar</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <>
                          <Text className="text-gray-700 text-sm">{r.texto}</Text>
                          <View className="flex-row justify-between items-center mt-1">
                            <Text className="text-gray-400 text-xs">{r.advogado?.nome} · {new Date(r.dataCriacao).toLocaleDateString('pt-BR')}</Text>
                            {souResponsavel ? (
                              <View className="flex-row gap-3">
                                <TouchableOpacity onPress={() => { setEditId(r.id); setEditTexto(r.texto); }}>
                                  <Text className="text-primary text-xs font-semibold">Editar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => excluir(r.id)}>
                                  <Text className="text-red-500 text-xs font-semibold">Excluir</Text>
                                </TouchableOpacity>
                              </View>
                            ) : null}
                          </View>
                        </>
                      )}
                    </View>
                  ))
                )}

                <TouchableOpacity onPress={fechar} className="bg-gray-100 py-3 rounded-xl items-center mt-4">
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
