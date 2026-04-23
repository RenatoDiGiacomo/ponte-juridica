import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipoLogin, setTipoLogin] = useState<'cliente' | 'advogado'>('cliente');
  const [loading, setLoading] = useState(false);
  const { loginCliente, loginAdvogado } = useAuth();

  async function handleLogin() {
    if (!email || !senha) return Alert.alert('Preencha todos os campos');
    setLoading(true);
    try {
      if (tipoLogin === 'cliente') await loginCliente(email, senha);
      else await loginAdvogado(email, senha);
    } catch {
      Alert.alert('Erro', 'E-mail ou senha inválidos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-background justify-center px-6">
      <Text className="text-3xl font-bold text-primary text-center mb-2">
        Ponte Jurídica
      </Text>
      <Text className="text-gray-500 text-center mb-8">
        Conectando você ao advogado certo
      </Text>

      {/* Seletor de tipo */}
      <View className="flex-row bg-gray-200 rounded-xl mb-6 p-1">
        {(['cliente', 'advogado'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTipoLogin(t)}
            className={`flex-1 py-2 rounded-lg ${tipoLogin === t ? 'bg-white shadow' : ''}`}
          >
            <Text className={`text-center font-medium ${tipoLogin === t ? 'text-primary' : 'text-gray-500'}`}>
              {t === 'cliente' ? 'Sou Cliente' : 'Sou Advogado'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-3 text-base"
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-6 text-base"
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        className="bg-primary py-4 rounded-xl items-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-base">Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Registro')} className="mt-4">
        <Text className="text-center text-primary">
          Não tem conta? <Text className="font-bold">Cadastre-se</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
