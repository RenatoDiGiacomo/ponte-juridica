import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { processosService } from '../../services/api';

const ESPECIALIZACOES = [
  'Criminal',
  'Trabalhista',
  'Família',
  'Cível',
  'Tributário',
  'Previdenciário',
];

export function CriarProcessoScreen({ navigation }: any) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [especializacao, setEspecializacao] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (titulo.trim().length < 5) {
      Alert.alert('Atenção', 'O título precisa ter pelo menos 5 caracteres');
      return;
    }
    if (descricao.trim().length < 20) {
      Alert.alert('Atenção', 'Descreva seu caso com mais detalhes (mínimo 20 caracteres)');
      return;
    }
    if (!especializacao) {
      Alert.alert('Atenção', 'Selecione a área jurídica');
      return;
    }
    setSalvando(true);
    try {
      await processosService.criar({ titulo, descricao, especializacao });
      Alert.alert('Sucesso', 'Caso publicado! Advogados da área já podem te enviar propostas.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao publicar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-10">
      <View className="rounded-2xl bg-white p-5 shadow-sm">
        <Text className="mb-4 text-sm text-slate-500">Publique seu caso e advogados especializados vão te enviar propostas.</Text>

        <Text className="mb-1 text-sm font-semibold text-slate-700">Título</Text>
        <TextInput
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ex: Rescisão indireta por atraso de salário"
          className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3"
        />

        <Text className="mb-1 text-sm font-semibold text-slate-700">Descreva seu caso</Text>
        <TextInput
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Conte o que aconteceu, há quanto tempo, e quais documentos você tem."
          multiline
          textAlignVertical="top"
          className="mb-4 h-40 rounded-xl border border-slate-200 bg-slate-50 p-3"
        />

        <Text className="mb-2 text-sm font-semibold text-slate-700">Área jurídica</Text>
        <View className="mb-6 flex-row flex-wrap gap-2">
          {ESPECIALIZACOES.map((esp) => {
            const ativo = especializacao === esp;
            return (
              <TouchableOpacity key={esp} onPress={() => setEspecializacao(esp)} className={`rounded-full border px-4 py-2 ${ativo ? 'border-primary bg-primary' : 'border-slate-300 bg-white'}`}>
                <Text className={ativo ? 'font-medium text-white' : 'text-slate-600'}>{esp}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity onPress={salvar} disabled={salvando} className="items-center rounded-xl bg-secondary py-4">
          {salvando ? <ActivityIndicator color="#1a3a5c" /> : <Text className="text-base font-bold text-primary">Publicar caso</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
