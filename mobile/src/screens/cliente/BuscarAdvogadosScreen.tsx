import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { advogadosService, conexoesService } from '../../services/api';

const ESPECIALIZACOES = ['Todos', 'Criminal', 'Trabalhista', 'Família', 'Cível', 'Tributário', 'Previdenciário'];

export function BuscarAdvogadosScreen() {
  const [advogados, setAdvogados] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('Todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscar();
  }, [filtro]);

  async function buscar() {
    setLoading(true);
    try {
      const esp = filtro === 'Todos' ? undefined : filtro;
      const { data } = await advogadosService.listar(esp);
      setAdvogados(data);
    } finally {
      setLoading(false);
    }
  }

  async function conectar(advogadoId: number) {
    try {
      await conexoesService.conectar(advogadoId);
      alert('Vínculo criado com sucesso!');
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Erro ao criar vínculo');
    }
  }

  return (
    <View className="flex-1 bg-background">
      {/* Filtros */}
      <FlatList
        horizontal
        data={ESPECIALIZACOES}
        keyExtractor={(i) => i}
        showsHorizontalScrollIndicator={false}
        className="py-3 px-4 max-h-14"
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setFiltro(item)}
            className={`px-4 py-2 rounded-full mr-2 ${filtro === item ? 'bg-primary' : 'bg-white border border-gray-300'}`}
          >
            <Text className={filtro === item ? 'text-white font-medium' : 'text-gray-600'}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator className="mt-10" color="#1E3A5F" />
      ) : (
        <FlatList
          data={advogados}
          keyExtractor={(i) => String(i.id)}
          contentContainerClassName="px-4 pb-6"
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <Text className="text-lg font-bold text-primary">{item.nome}</Text>
              <Text className="text-secondary font-medium">{item.especializacao}</Text>
              <Text className="text-gray-500 text-sm mt-1">OAB: {item.oab}</Text>
              <Text className="text-gray-500 text-sm">Plano: {item.plano?.nome}</Text>
              <TouchableOpacity
                onPress={() => conectar(item.id)}
                className="bg-primary mt-3 py-2 rounded-xl items-center"
              >
                <Text className="text-white font-medium">Solicitar Contato</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
