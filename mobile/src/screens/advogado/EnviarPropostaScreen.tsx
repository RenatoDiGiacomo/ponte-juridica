import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { processosService } from '../../services/api';
import { mascaraMoeda, moedaParaNumero } from '../../utils/moeda';

export function EnviarPropostaScreen({ route, navigation }: any) {
  const processo = route.params?.processo;
  const mp = processo?.minhaProposta ?? null;
  const editando = !!mp;

  const [mensagem, setMensagem] = useState(editando ? mp.mensagem : '');
  // valorEstimado vem como Decimal serializado (ex.: "5500"); converter p/ centavos antes da máscara.
  const [valor, setValor] = useState(editando ? mascaraMoeda(String(Math.round(Number(mp.valorEstimado) * 100))) : '');
  const [enviando, setEnviando] = useState(false);
  const [mostrarCancelar, setMostrarCancelar] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [cancelando, setCancelando] = useState(false);

  async function salvar() {
    if (mensagem.trim().length < 20) return Alert.alert('Atenção', 'Escreva uma mensagem de pelo menos 20 caracteres');
    const valorNum = moedaParaNumero(valor);
    if (!valorNum || valorNum <= 0) return Alert.alert('Atenção', 'Informe um valor estimado válido');
    setEnviando(true);
    try {
      if (editando) {
        await processosService.editarProposta(mp.id, { mensagem, valorEstimado: valorNum });
        Alert.alert('Pronto', 'Proposta atualizada.');
      } else {
        await processosService.enviarProposta(processo.id, { mensagem, valorEstimado: valorNum });
        Alert.alert('Sucesso', 'Proposta enviada! O cliente foi notificado.');
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao salvar');
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar() {
    if (justificativa.trim().length < 5) return Alert.alert('Atenção', 'Informe uma justificativa (mín. 5 caracteres)');
    setCancelando(true);
    try {
      await processosService.cancelarProposta(mp.id, justificativa.trim());
      Alert.alert('Pronto', 'Proposta cancelada.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao cancelar');
    } finally {
      setCancelando(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-10">
      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <Text className="text-lg font-bold text-primary">{processo.titulo}</Text>
        <Text className="text-sm font-medium text-secondary">{processo.especializacao}</Text>
        <Text className="mt-2 text-sm text-gray-600">{processo.descricao}</Text>
        <Text className="mt-2 text-xs text-gray-500">por {processo.cliente.nome}</Text>
      </View>

      <Text className="mb-1 text-base font-semibold text-primary">Sua mensagem</Text>
      <TextInput
        value={mensagem}
        onChangeText={setMensagem}
        placeholder="Apresente-se e diga como pode ajudar nesse caso."
        multiline
        textAlignVertical="top"
        className="mb-4 h-40 rounded-xl border border-gray-200 bg-white p-3"
      />

      <Text className="mb-1 text-base font-semibold text-primary">Valor estimado (R$)</Text>
      <TextInput
        value={valor}
        onChangeText={(v) => setValor(mascaraMoeda(v))}
        placeholder="0,00"
        keyboardType="number-pad"
        className="mb-6 rounded-xl border border-gray-200 bg-white p-3"
      />

      <TouchableOpacity onPress={salvar} disabled={enviando} className="items-center rounded-xl bg-primary py-4">
        {enviando ? <ActivityIndicator color="#fff" /> : <Text className="text-base font-bold text-white">{editando ? 'Salvar alterações' : 'Enviar proposta'}</Text>}
      </TouchableOpacity>

      {/* Cancelar a própria proposta (modo edição) */}
      {editando && (
        <View className="mt-4 rounded-2xl border border-red-100 bg-red-50/50 p-4">
          {!mostrarCancelar ? (
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-xs font-bold uppercase tracking-wider text-erro">Cancelar proposta</Text>
                <Text className="text-[11px] text-slate-500">Some da sua lista e o cliente vê o motivo.</Text>
              </View>
              <TouchableOpacity onPress={() => setMostrarCancelar(true)} className="rounded-lg border border-red-300 bg-white px-3 py-1.5">
                <Text className="text-xs font-bold text-erro">Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text className="mb-1 text-[11px] text-slate-500">Justificativa (será exibida ao cliente):</Text>
              <TextInput
                value={justificativa}
                onChangeText={setJustificativa}
                placeholder="Ex.: agenda lotada no período."
                multiline
                textAlignVertical="top"
                className="h-20 rounded-xl border border-red-200 bg-white p-3"
              />
              <View className="mt-2 flex-row gap-2">
                <TouchableOpacity onPress={cancelar} disabled={cancelando} className="flex-1 items-center rounded-lg bg-erro py-2.5">
                  {cancelando ? <ActivityIndicator color="#fff" /> : <Text className="font-bold text-white">Confirmar cancelamento</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMostrarCancelar(false)} className="flex-1 items-center rounded-lg border border-gray-200 bg-white py-2.5">
                  <Text className="font-medium text-gray-600">Voltar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
