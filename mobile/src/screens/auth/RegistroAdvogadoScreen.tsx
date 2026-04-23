import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { authService, planosService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ESPECIALIZACOES = ['Criminal', 'Trabalhista', 'Família', 'Cível', 'Tributário', 'Previdenciário'];

export function RegistroAdvogadoScreen({ navigation }: any) {
  const [form, setForm] = useState({
    nome: '', email: '', oab: '', especializacao: '', planoId: 0, senha: '', confirmarSenha: '',
  });
  const [planos, setPlanos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { loginAdvogado } = useAuth();

  useEffect(() => {
    planosService.listar().then(({ data }) => setPlanos(data));
  }, []);

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleRegistro() {
    if (!form.nome || !form.email || !form.oab || !form.especializacao || !form.planoId || !form.senha)
      return Alert.alert('Preencha todos os campos');
    if (form.senha !== form.confirmarSenha)
      return Alert.alert('As senhas não coincidem');

    setLoading(true);
    try {
      await authService.registrarAdvogado({
        nome: form.nome,
        email: form.email,
        oab: form.oab,
        especializacao: form.especializacao,
        planoId: form.planoId,
        senha: form.senha,
      });
      await loginAdvogado(form.email, form.senha);
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.message ?? 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerClassName="px-6 py-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
          <Text className="text-primary font-medium">← Voltar</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-primary mb-1">Criar conta</Text>
        <Text className="text-gray-500 mb-8">Sou advogado</Text>

        {[
          { label: 'Nome completo', field: 'nome', placeholder: 'Dr. João Silva' },
          { label: 'E-mail', field: 'email', placeholder: 'joao@escritorio.com', keyboard: 'email-address' as const },
          { label: 'Número da OAB', field: 'oab', placeholder: '12345/SP' },
        ].map(({ label, field, placeholder, keyboard }) => (
          <View key={field} className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
              placeholder={placeholder}
              value={(form as any)[field]}
              onChangeText={(v) => set(field, v)}
              keyboardType={keyboard ?? 'default'}
              autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
            />
          </View>
        ))}

        {/* Especialização */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Especialização</Text>
          <View className="flex-row flex-wrap gap-2">
            {ESPECIALIZACOES.map((esp) => (
              <TouchableOpacity
                key={esp}
                onPress={() => set('especializacao', esp)}
                className={`px-3 py-2 rounded-full border ${
                  form.especializacao === esp
                    ? 'bg-primary border-primary'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text className={form.especializacao === esp ? 'text-white font-medium' : 'text-gray-600'}>
                  {esp}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Plano */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Plano de assinatura</Text>
          {planos.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => set('planoId', p.id)}
              className={`flex-row justify-between items-center p-4 rounded-xl border mb-2 ${
                form.planoId === p.id ? 'border-primary bg-blue-50' : 'border-gray-300 bg-white'
              }`}
            >
              <View>
                <Text className={`font-bold ${form.planoId === p.id ? 'text-primary' : 'text-gray-800'}`}>
                  {p.nome}
                </Text>
                <Text className="text-gray-500 text-sm">R$ {Number(p.valorMensal).toFixed(2)}/mês</Text>
              </View>
              <View className={`w-5 h-5 rounded-full border-2 ${
                form.planoId === p.id ? 'border-primary bg-primary' : 'border-gray-400'
              }`} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Senha */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Senha</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            placeholder="Mínimo 6 caracteres"
            value={form.senha}
            onChangeText={(v) => set('senha', v)}
            secureTextEntry
          />
        </View>

        <View className="mb-8">
          <Text className="text-sm font-medium text-gray-700 mb-1">Confirmar senha</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base"
            placeholder="Repita a senha"
            value={form.confirmarSenha}
            onChangeText={(v) => set('confirmarSenha', v)}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          onPress={handleRegistro}
          disabled={loading}
          className="bg-primary py-4 rounded-xl items-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Criar conta</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
