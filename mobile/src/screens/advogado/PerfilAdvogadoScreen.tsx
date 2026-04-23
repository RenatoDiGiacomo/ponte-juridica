import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { advogadosService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_COLOR: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  pendente: 'bg-yellow-100 text-yellow-700',
  cancelado: 'bg-red-100 text-red-700',
};

export function PerfilAdvogadoScreen() {
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    advogadosService.meuPerfil()
      .then(({ data }) => setPerfil(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator className="mt-20" color="#1E3A5F" />;
  if (!perfil) return null;

  const statusClass = STATUS_COLOR[perfil.assinatura] ?? 'bg-gray-100 text-gray-600';

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-8">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">{perfil.nome}</Text>
            <Text className="text-blue-200 mt-1">{perfil.especializacao}</Text>
            <Text className="text-blue-300 text-sm mt-1">OAB: {perfil.oab}</Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${statusClass}`}>
            <Text className="text-xs font-medium capitalize">{perfil.assinatura}</Text>
          </View>
        </View>
      </View>

      <View className="px-6 py-6 gap-4">
        {/* Plano */}
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wide">Plano atual</Text>
          <Text className="text-primary text-lg font-bold">{perfil.plano?.nome}</Text>
          <Text className="text-gray-500 text-sm">
            R$ {Number(perfil.plano?.valorMensal).toFixed(2)}/mês · R$ {Number(perfil.plano?.valorAnual).toFixed(2)}/ano
          </Text>
        </View>

        {/* Stats */}
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wide">Estatísticas</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-3xl font-bold text-primary">{perfil.conexoes?.length ?? 0}</Text>
              <Text className="text-gray-500 text-sm mt-1">Clientes</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center">
              <Text className="text-3xl font-bold text-secondary">
                {new Date(perfil.dataCadastro).getFullYear()}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">Desde</Text>
            </View>
          </View>
        </View>

        {/* Clientes recentes */}
        {perfil.conexoes?.length > 0 && (
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wide">
              Clientes recentes
            </Text>
            {perfil.conexoes.slice(0, 3).map((c: any) => (
              <View key={c.id} className="flex-row items-center py-2 border-b border-gray-100 last:border-0">
                <View className="w-9 h-9 rounded-full bg-blue-100 items-center justify-center mr-3">
                  <Text className="text-primary font-bold">{c.cliente?.nome?.[0]}</Text>
                </View>
                <View>
                  <Text className="font-medium text-gray-800">{c.cliente?.nome}</Text>
                  <Text className="text-gray-400 text-xs">{c.cliente?.email}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          onPress={logout}
          className="bg-red-50 border border-red-200 py-4 rounded-xl items-center mt-2"
        >
          <Text className="text-red-600 font-medium">Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
