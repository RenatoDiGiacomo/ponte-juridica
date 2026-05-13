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

export function EnviarPropostaScreen({ route, navigation }: any) {
  const processo = route.params?.processo;
  const [mensagem, setMensagem] = useState('');
  const [valor, setValor] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (mensagem.trim().length < 20) {
      Alert.alert('Atenção', 'Escreva uma mensagem de pelo menos 20 caracteres');
      return;
    }
    const valorNum = Number(valor.replace(',', '.'));
    if (!valorNum || valorNum <= 0) {
      Alert.alert('Atenção', 'Informe um valor estimado válido');
      return;
    }
    setEnviando(true);
    try {
      await processosService.enviarProposta(processo.id, {
        mensagem,
        valorEstimado: valorNum,
      });
      Alert.alert('Sucesso', 'Proposta enviada! O cliente foi notificado.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao enviar');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-10">
      <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
        <Text className="text-lg font-bold text-primary">{processo.titulo}</Text>
        <Text className="text-secondary font-medium text-sm">{processo.especializacao}</Text>
        <Text className="text-gray-600 text-sm mt-2">{processo.descricao}</Text>
        <Text className="text-xs text-gray-500 mt-2">por {processo.cliente.nome}</Text>
      </View>

      <Text className="text-base font-semibold text-primary mb-1">Sua mensagem</Text>
      <TextInput
        value={mensagem}
        onChangeText={setMensagem}
        placeholder="Apresente-se e diga como pode ajudar nesse caso."
        multiline
        textAlignVertical="top"
        className="bg-white rounded-xl p-3 mb-4 border border-gray-200 h-40"
      />

      <Text className="text-base font-semibold text-primary mb-1">Valor estimado (R$)</Text>
      <TextInput
        value={valor}
        onChangeText={setValor}
        placeholder="Ex: 1500"
        keyboardType="decimal-pad"
        className="bg-white rounded-xl p-3 mb-6 border border-gray-200"
      />

      <TouchableOpacity
        onPress={enviar}
        disabled={enviando}
        className="bg-primary py-4 rounded-xl items-center"
      >
        {enviando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-bold text-base">Enviar proposta</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
