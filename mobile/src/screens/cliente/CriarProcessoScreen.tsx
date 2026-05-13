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
      <Text className="text-base font-semibold text-primary mb-1">Título</Text>
      <TextInput
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Ex: Rescisão indireta por atraso de salário"
        className="bg-white rounded-xl p-3 mb-4 border border-gray-200"
      />

      <Text className="text-base font-semibold text-primary mb-1">Descreva seu caso</Text>
      <TextInput
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Conte o que aconteceu, há quanto tempo, e quais documentos você tem."
        multiline
        textAlignVertical="top"
        className="bg-white rounded-xl p-3 mb-4 border border-gray-200 h-40"
      />

      <Text className="text-base font-semibold text-primary mb-2">Área jurídica</Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {ESPECIALIZACOES.map((esp) => (
          <TouchableOpacity
            key={esp}
            onPress={() => setEspecializacao(esp)}
            className={`px-4 py-2 rounded-full border ${
              especializacao === esp ? 'bg-primary border-primary' : 'bg-white border-gray-300'
            }`}
          >
            <Text
              className={
                especializacao === esp ? 'text-white font-medium' : 'text-gray-600'
              }
            >
              {esp}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={salvar}
        disabled={salvando}
        className="bg-primary py-4 rounded-xl items-center"
      >
        {salvando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-bold text-base">Publicar caso</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
