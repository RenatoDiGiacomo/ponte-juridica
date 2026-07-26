import React from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

interface Props {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  destrutivo?: boolean;
  carregando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Diálogo de confirmação in-app (RN Modal). Substitui Alert.alert com botões —
 * que não dispara o onPress de forma confiável no Expo Web (bug do "aceitar").
 */
export function ConfirmModal({
  aberto, titulo, mensagem, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar',
  destrutivo = false, carregando = false, onConfirmar, onCancelar,
}: Props) {
  return (
    <Modal visible={aberto} animationType="fade" transparent onRequestClose={onCancelar}>
      <View className="flex-1 items-center justify-center bg-black/40 px-8">
        <View className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <Text className={`text-lg font-bold ${destrutivo ? 'text-erro' : 'text-primary'}`}>{titulo}</Text>
          <Text className="mt-2 text-sm text-gray-600">{mensagem}</Text>
          <View className="mt-5 flex-row gap-2">
            <TouchableOpacity
              onPress={onConfirmar}
              disabled={carregando}
              className={`flex-1 items-center rounded-xl py-3 ${destrutivo ? 'bg-erro' : 'bg-primary'}`}
            >
              {carregando ? <ActivityIndicator color="#fff" /> : <Text className="font-bold text-white">{textoConfirmar}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancelar} className="flex-1 items-center rounded-xl border border-gray-200 py-3">
              <Text className="font-medium text-gray-600">{textoCancelar}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
