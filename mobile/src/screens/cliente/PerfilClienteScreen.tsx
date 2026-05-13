import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { authService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

type Perfil = {
  id: number;
  nome: string;
  email: string;
  documento: string;
  dataCadastro: string;
};

export function PerfilClienteScreen() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    authService
      .me()
      .then(({ data }) => setPerfil(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator className="mt-20" color="#1E3A5F" />;
  if (!perfil) return null;

  const inicial = perfil.nome.trim()[0]?.toUpperCase() ?? '?';

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="bg-primary px-6 pt-14 pb-8">
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-full bg-white items-center justify-center mr-4">
            <Text className="text-primary text-2xl font-bold">{inicial}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">{perfil.nome}</Text>
            <Text className="text-blue-200 mt-1">{perfil.email}</Text>
          </View>
        </View>
      </View>

      <View className="px-6 py-6 gap-4">
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wide">
            Dados pessoais
          </Text>
          <View className="mt-2 gap-2">
            <View>
              <Text className="text-gray-400 text-xs">Documento</Text>
              <Text className="text-gray-800">{perfil.documento}</Text>
            </View>
            <View>
              <Text className="text-gray-400 text-xs">Cliente desde</Text>
              <Text className="text-gray-800">
                {new Date(perfil.dataCadastro).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
        </View>

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
