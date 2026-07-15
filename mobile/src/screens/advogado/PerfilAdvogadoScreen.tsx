import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { advogadosService, areasService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_COLOR: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  pendente: 'bg-yellow-100 text-yellow-700',
  cancelado: 'bg-red-100 text-red-700',
};

const CAMPOS: { campo: string; label: string; placeholder?: string; uf?: boolean }[] = [
  { campo: 'nome', label: 'Nome' },
  { campo: 'oab', label: 'OAB' },
  { campo: 'escritorio', label: 'Escritório / banca', placeholder: 'Ex.: Ferreira & Associados' },
  { campo: 'cidadeAtuacao', label: 'Cidade de atuação' },
  { campo: 'estadoAtuacao', label: 'UF de atuação', uf: true },
  { campo: 'telefone', label: 'Telefone', placeholder: '(11) 3000-0000' },
  { campo: 'whatsapp', label: 'WhatsApp', placeholder: '(11) 99000-0000' },
  { campo: 'enderecoLogradouro', label: 'Logradouro', placeholder: 'Av. Paulista' },
  { campo: 'enderecoNumero', label: 'Número' },
  { campo: 'enderecoBairro', label: 'Bairro' },
  { campo: 'enderecoCep', label: 'CEP', placeholder: '01310-100' },
];

const VAZIO = {
  nome: '', oab: '', escritorio: '', cidadeAtuacao: '', estadoAtuacao: '',
  telefone: '', whatsapp: '', enderecoLogradouro: '', enderecoNumero: '',
  enderecoBairro: '', enderecoCep: '', bio: '',
};

export function PerfilAdvogadoScreen() {
  const [perfil, setPerfil] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>(VAZIO);
  const [todasAreas, setTodasAreas] = useState<{ id: number; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const { logout } = useAuth();

  function aplicar(p: any) {
    setPerfil(p);
    const f: Record<string, string> = { ...VAZIO };
    Object.keys(VAZIO).forEach((k) => (f[k] = p[k] ?? ''));
    setForm(f);
  }

  async function carregar() {
    const [{ data: p }, { data: a }] = await Promise.all([advogadosService.meuPerfil(), areasService.listar()]);
    aplicar(p);
    setTodasAreas(a);
  }

  useEffect(() => { carregar().finally(() => setLoading(false)); }, []);

  const set = (c: string) => (v: string) => setForm((f) => ({ ...f, [c]: c === 'estadoAtuacao' ? v.toUpperCase() : v }));

  async function salvar() {
    setSalvando(true);
    try {
      const { data } = await advogadosService.atualizarPerfil(form);
      aplicar(data);
      Alert.alert('Pronto', 'Perfil atualizado');
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  async function toggleArea(area: { id: number; nome: string }, ativa: boolean) {
    try {
      const { data } = ativa
        ? await advogadosService.removerArea(area.id)
        : await advogadosService.adicionarArea(area.id);
      aplicar(data);
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao atualizar áreas');
    }
  }

  if (loading) return <ActivityIndicator className="mt-20" color="#1E3A5F" />;
  if (!perfil) return null;

  const statusClass = STATUS_COLOR[perfil.assinatura] ?? 'bg-gray-100 text-gray-600';
  const areasAtivas: string[] = perfil.areas ?? [];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-10">
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-8">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">{perfil.nome}</Text>
            {perfil.escritorio ? <Text className="text-blue-200 mt-0.5">🏢 {perfil.escritorio}</Text> : null}
            <Text className="text-blue-200 mt-1">{areasAtivas.join(', ') || '—'}</Text>
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
            R$ {Number(perfil.plano?.valorMensal).toFixed(2)}/mês · {perfil.clientesVinculados ?? 0} clientes
          </Text>
        </View>

        {/* Áreas de atuação */}
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wide">Áreas de atuação</Text>
          <View className="flex-row flex-wrap gap-2">
            {todasAreas.map((a) => {
              const ativa = areasAtivas.includes(a.nome);
              return (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => toggleArea(a, ativa)}
                  className={`px-3 py-2 rounded-full border ${ativa ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}
                >
                  <Text className={ativa ? 'text-white font-medium' : 'text-gray-600'}>{ativa ? '✓ ' : ''}{a.nome}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dados editáveis */}
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wide">Dados do perfil</Text>
          {CAMPOS.map(({ campo, label, placeholder, uf }) => (
            <View key={campo} className="mb-3">
              <Text className="text-sm text-gray-600 mb-1">{label}</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-base"
                value={form[campo]}
                onChangeText={set(campo)}
                placeholder={placeholder}
                maxLength={uf ? 2 : undefined}
                autoCapitalize={uf ? 'characters' : 'sentences'}
              />
            </View>
          ))}
          <View className="mb-1">
            <Text className="text-sm text-gray-600 mb-1">Apresentação (bio)</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-base h-24"
              value={form.bio}
              onChangeText={set('bio')}
              placeholder="Conte sua experiência e áreas de foco."
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
          </View>
          <TouchableOpacity onPress={salvar} disabled={salvando} className="bg-primary py-3 rounded-xl items-center mt-2">
            {salvando ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Salvar</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={logout} className="bg-red-50 border border-red-200 py-4 rounded-xl items-center mt-2">
          <Text className="text-red-600 font-medium">Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
