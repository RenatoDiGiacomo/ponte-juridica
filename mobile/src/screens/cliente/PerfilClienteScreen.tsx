import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { clientesService, midiaService, API_HOST } from '../../services/api';
import { escolherFoto, escolherDocumento } from '../../utils/upload';
import { useAuth } from '../../contexts/AuthContext';

const VAZIO = {
  nome: '', email: '', documento: '', dataNascimento: '',
  telefone: '', enderecoLogradouro: '', enderecoNumero: '', enderecoBairro: '',
  enderecoCidade: '', enderecoEstado: '', enderecoCep: '',
};

const BASICOS: { campo: keyof typeof VAZIO; label: string; keyboard?: 'email-address' | 'default'; placeholder?: string }[] = [
  { campo: 'nome', label: 'Nome completo' },
  { campo: 'email', label: 'E-mail', keyboard: 'email-address' },
  { campo: 'documento', label: 'CPF / CNPJ' },
  { campo: 'dataNascimento', label: 'Data de nascimento', placeholder: 'AAAA-MM-DD' },
];

const PRIVADOS: { campo: keyof typeof VAZIO; label: string; uf?: boolean; placeholder?: string }[] = [
  { campo: 'telefone', label: 'Telefone', placeholder: '(11) 99999-0000' },
  { campo: 'enderecoLogradouro', label: 'Logradouro' },
  { campo: 'enderecoNumero', label: 'Número' },
  { campo: 'enderecoBairro', label: 'Bairro' },
  { campo: 'enderecoCidade', label: 'Cidade' },
  { campo: 'enderecoEstado', label: 'UF', uf: true },
  { campo: 'enderecoCep', label: 'CEP', placeholder: '01000-000' },
];

export function PerfilClienteScreen() {
  const [perfil, setPerfil] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>(VAZIO);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState<'foto' | 'documento' | null>(null);
  const { logout, recemCadastrado, limparRecemCadastrado } = useAuth();

  function aplicar(p: any) {
    setPerfil(p);
    const f: Record<string, string> = { ...VAZIO };
    Object.keys(VAZIO).forEach((k) => {
      f[k] = k === 'dataNascimento' && p[k] ? String(p[k]).slice(0, 10) : (p[k] ?? '');
    });
    setForm(f);
  }

  useEffect(() => {
    clientesService.meuPerfil().then(({ data }) => aplicar(data)).finally(() => setLoading(false));
  }, []);

  const set = (c: string) => (v: string) => setForm((f) => ({ ...f, [c]: c === 'enderecoEstado' ? v.toUpperCase() : v }));

  async function salvar() {
    setSalvando(true);
    try {
      const { data } = await clientesService.atualizarPerfil(form);
      aplicar(data);
      Alert.alert('Pronto', 'Perfil atualizado');
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  async function enviarFoto() {
    const arquivo = await escolherFoto();
    if (!arquivo) return;
    setEnviando('foto');
    try {
      await midiaService.enviarFoto(arquivo);
      const { data } = await clientesService.meuPerfil();
      aplicar(data);
      Alert.alert('Pronto', 'Foto atualizada');
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao enviar foto');
    } finally {
      setEnviando(null);
    }
  }

  async function enviarDocumento() {
    const arquivo = await escolherDocumento();
    if (!arquivo) return;
    setEnviando('documento');
    try {
      await midiaService.enviarDocumento(arquivo);
      const { data } = await clientesService.meuPerfil();
      aplicar(data);
      Alert.alert('Pronto', 'Documento enviado (privado)');
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Falha ao enviar documento');
    } finally {
      setEnviando(null);
    }
  }

  if (loading) return <ActivityIndicator className="mt-20" color="#1E3A5F" />;
  if (!perfil) return null;

  const inicial = (perfil.nome ?? '?').trim()[0]?.toUpperCase() ?? '?';

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-10">
      {/* Header */}
      <View className="bg-primary px-6 pt-14 pb-8">
        <View className="flex-row items-center">
          {perfil.fotoPath ? (
            <Image source={{ uri: `${API_HOST}${perfil.fotoPath}` }} className="w-16 h-16 rounded-full mr-4" />
          ) : (
            <View className="w-16 h-16 rounded-full bg-white items-center justify-center mr-4">
              <Text className="text-primary text-2xl font-bold">{inicial}</Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">{perfil.nome}</Text>
            <Text className="text-blue-200 mt-1">{perfil.email}</Text>
          </View>
        </View>
      </View>

      <View className="px-6 py-6 gap-4">
        {recemCadastrado && (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <Text className="font-bold text-primary">👋 Bem-vindo à Ponte Jurídica!</Text>
            <Text className="text-gray-600 text-sm mt-1">Sua conta foi criada. Complete seu cadastro abaixo (foto, contato e endereço).</Text>
            <TouchableOpacity onPress={limparRecemCadastrado} className="self-start mt-2">
              <Text className="text-primary text-sm font-semibold">Entendi</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Foto de perfil */}
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wide">Foto de perfil (pública)</Text>
          <TouchableOpacity onPress={enviarFoto} disabled={enviando === 'foto'} className="bg-primary/10 py-3 rounded-xl items-center">
            {enviando === 'foto' ? <ActivityIndicator color="#1E3A5F" /> : <Text className="text-primary font-semibold">📷 {perfil.fotoPath ? 'Alterar foto' : 'Enviar foto'}</Text>}
          </TouchableOpacity>
        </View>

        {/* Dados básicos */}
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="text-xs text-gray-400 font-medium mb-3 uppercase tracking-wide">Dados básicos</Text>
          {BASICOS.map(({ campo, label, keyboard, placeholder }) => (
            <View key={campo} className="mb-3">
              <Text className="text-sm text-gray-600 mb-1">{label}</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-base"
                value={form[campo]}
                onChangeText={set(campo)}
                placeholder={placeholder}
                keyboardType={keyboard ?? 'default'}
                autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
              />
            </View>
          ))}
        </View>

        {/* Dados privados */}
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wide">Dados privados 🔒</Text>
          <Text className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            Seus contatos e endereço nunca são compartilhados com advogados sem vínculo.
          </Text>
          {PRIVADOS.map(({ campo, label, uf, placeholder }) => (
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

          {/* Documento (privado) */}
          <View className="mb-2">
            <Text className="text-sm text-gray-600 mb-1">Documento (RG/CPF) 🔒 privado</Text>
            <TouchableOpacity onPress={enviarDocumento} disabled={enviando === 'documento'} className="bg-gray-100 py-3 rounded-xl items-center">
              {enviando === 'documento' ? <ActivityIndicator color="#1E3A5F" /> : <Text className="text-gray-700 font-medium">📎 {perfil.temDocumento ? 'Substituir documento' : 'Enviar documento'}</Text>}
            </TouchableOpacity>
            {perfil.temDocumento ? <Text className="text-emerald-600 text-xs mt-1">✓ Documento enviado (privado).</Text> : null}
          </View>

          <TouchableOpacity onPress={salvar} disabled={salvando} className="bg-primary py-3 rounded-xl items-center mt-2">
            {salvando ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Salvar alterações</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={logout} className="bg-red-50 border border-red-200 py-4 rounded-xl items-center mt-2">
          <Text className="text-red-600 font-medium">Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
