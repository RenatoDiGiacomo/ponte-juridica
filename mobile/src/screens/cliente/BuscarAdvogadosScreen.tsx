import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
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
      const area = filtro === 'Todos' ? undefined : filtro;
      const { data } = await advogadosService.buscar({ ...(area && { area }), page: 1, pageSize: 50 });
      setAdvogados(data.data ?? data);
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
      <View className="flex-row flex-wrap gap-2 px-4 py-3">
        {ESPECIALIZACOES.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setFiltro(item)}
            style={{ flexGrow: 0, flexShrink: 0 }}
            className={`px-4 py-2 rounded-full border ${
              filtro === item ? 'bg-primary border-primary' : 'bg-white border-gray-300'
            }`}
          >
            <Text className={filtro === item ? 'text-white font-medium' : 'text-gray-600'}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
              {item.escritorio ? <Text className="text-gray-500 text-xs">🏢 {item.escritorio}</Text> : null}
              <Text className="text-secondary font-medium">{(item.areas ?? []).join(', ') || '—'}</Text>
              <View className="flex-row flex-wrap gap-x-3 mt-1">
                <Text className="text-gray-500 text-sm">OAB: {item.oab}</Text>
                <Text className="text-gray-500 text-sm">★ {item.nota ?? '—'}</Text>
                {item.cidadeAtuacao ? <Text className="text-gray-500 text-sm">📍 {item.cidadeAtuacao}{item.estadoAtuacao ? `/${item.estadoAtuacao}` : ''}</Text> : null}
              </View>
              <Text className="text-gray-500 text-sm">Plano: {item.plano?.nome}</Text>
              {item.bio ? <Text className="text-gray-500 text-xs mt-2" numberOfLines={2}>{item.bio}</Text> : null}
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
