import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { authService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export function RegistroClienteScreen({ navigation }: any) {
  const [form, setForm] = useState({ nome: '', email: '', documento: '', senha: '', confirmarSenha: '' });
  const [loading, setLoading] = useState(false);
  const { loginCliente } = useAuth();

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleRegistro() {
    if (!form.nome || !form.email || !form.documento || !form.senha)
      return Alert.alert('Preencha todos os campos');
    if (form.senha !== form.confirmarSenha)
      return Alert.alert('As senhas não coincidem');
    if (form.senha.length < 6)
      return Alert.alert('Senha deve ter no mínimo 6 caracteres');

    setLoading(true);
    try {
      await authService.registrarCliente({
        nome: form.nome,
        email: form.email,
        documento: form.documento,
        senha: form.senha,
      });
      await loginCliente(form.email, form.senha);
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
        <Text className="text-gray-500 mb-8">Sou cliente / solicitante</Text>

        {[
          { label: 'Nome completo', field: 'nome', placeholder: 'João Silva' },
          { label: 'E-mail', field: 'email', placeholder: 'joao@email.com', keyboard: 'email-address' as const },
          { label: 'CPF ou CNPJ', field: 'documento', placeholder: '000.000.000-00' },
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
