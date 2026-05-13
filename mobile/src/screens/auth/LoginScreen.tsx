import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

type DemoUser = {
  label: string;
  email: string;
  tipo: 'cliente' | 'advogado';
  hint: string;
};

const DEMO_USERS: DemoUser[] = [
  { label: 'João Silva', tipo: 'cliente', email: 'cliente.demo@pontejuridica.com', hint: 'Cliente · tem caso em atendimento + propostas pendentes' },
  { label: 'Mariana Souza', tipo: 'cliente', email: 'mariana@pontejuridica.com', hint: 'Cliente · caso de Família' },
  { label: 'Dra. Maria Ferreira', tipo: 'advogado', email: 'maria.demo@pontejuridica.com', hint: 'Trabalhista · plano Profissional (20/mês)' },
  { label: 'Dra. Juliana Costa', tipo: 'advogado', email: 'juliana@pontejuridica.com', hint: 'Cível · plano Básico (5/mês)' },
  { label: 'Dr. Carlos Mendes', tipo: 'advogado', email: 'carlos@pontejuridica.com', hint: 'Criminal · plano Elite (ilimitado)' },
];

const SENHA_DEMO = 'senha123';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipoLogin, setTipoLogin] = useState<'cliente' | 'advogado'>('cliente');
  const [loading, setLoading] = useState(false);
  const { loginCliente, loginAdvogado } = useAuth();

  function preencherDemo(u: DemoUser) {
    setTipoLogin(u.tipo);
    setEmail(u.email);
    setSenha(SENHA_DEMO);
  }

  async function entrarComoDemo(u: DemoUser) {
    setTipoLogin(u.tipo);
    setEmail(u.email);
    setSenha(SENHA_DEMO);
    setLoading(true);
    try {
      if (u.tipo === 'cliente') await loginCliente(u.email, SENHA_DEMO);
      else await loginAdvogado(u.email, SENHA_DEMO);
    } catch {
      Alert.alert('Erro', 'Não foi possível entrar como demo. O backend está rodando?');
    } finally {
      setLoading(false);
    }
  }

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
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-6 py-12"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-3xl font-bold text-primary text-center mb-2 mt-6">
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

      {/* Atalhos de demo */}
      <View className="mt-10 pt-6 border-t border-gray-200">
        <Text className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
          Acesso rápido — demo
        </Text>
        <Text className="text-xs text-gray-500 mb-3">
          Toque para entrar direto. Pressione o ícone para apenas preencher os campos.
        </Text>

        <View className="gap-2">
          {DEMO_USERS.map((u) => (
            <View
              key={u.email}
              className="bg-white border border-gray-200 rounded-xl flex-row items-center overflow-hidden"
            >
              <TouchableOpacity
                onPress={() => entrarComoDemo(u)}
                disabled={loading}
                className="flex-1 px-4 py-3"
              >
                <View className="flex-row items-center">
                  <View
                    className={`px-2 py-0.5 rounded-full mr-2 ${
                      u.tipo === 'cliente' ? 'bg-blue-100' : 'bg-amber-100'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold uppercase ${
                        u.tipo === 'cliente' ? 'text-blue-700' : 'text-amber-700'
                      }`}
                    >
                      {u.tipo}
                    </Text>
                  </View>
                  <Text className="font-semibold text-primary flex-1" numberOfLines={1}>
                    {u.label}
                  </Text>
                </View>
                <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                  {u.hint}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => preencherDemo(u)}
                disabled={loading}
                className="px-4 py-3 border-l border-gray-200"
                accessibilityLabel={`Preencher campos com ${u.label}`}
              >
                <Text className="text-primary text-lg">✎</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
