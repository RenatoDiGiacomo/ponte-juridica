import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Auth screens
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegistroClienteScreen } from './src/screens/auth/RegistroClienteScreen';
import { RegistroAdvogadoScreen } from './src/screens/auth/RegistroAdvogadoScreen';

// Cliente screens
import { BuscarAdvogadosScreen } from './src/screens/cliente/BuscarAdvogadosScreen';
import { MinhasConexoesScreen } from './src/screens/cliente/MinhasConexoesScreen';

// Advogado screens
import { PerfilAdvogadoScreen } from './src/screens/advogado/PerfilAdvogadoScreen';
import { ClientesAdvogadoScreen } from './src/screens/advogado/ClientesAdvogadoScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registro">
        {(props) => (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RegistroTipo" component={({ navigation }: any) => (
              <View className="flex-1 bg-background justify-center px-6">
                <Text className="text-2xl font-bold text-primary text-center mb-8">Como deseja se cadastrar?</Text>
                <View className="gap-4">
                  <Text
                    onPress={() => navigation.navigate('RegistroCliente')}
                    className="bg-primary text-white text-center py-4 rounded-xl font-bold text-base"
                  >Sou Cliente</Text>
                  <Text
                    onPress={() => navigation.navigate('RegistroAdvogado')}
                    className="bg-white border border-primary text-primary text-center py-4 rounded-xl font-bold text-base"
                  >Sou Advogado</Text>
                  <Text
                    onPress={() => (props as any).navigation.goBack()}
                    className="text-gray-400 text-center py-2"
                  >← Voltar ao login</Text>
                </View>
              </View>
            )} />
            <Stack.Screen name="RegistroCliente" component={RegistroClienteScreen} />
            <Stack.Screen name="RegistroAdvogado" component={RegistroAdvogadoScreen} />
          </Stack.Navigator>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function ClienteTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1E3A5F',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { paddingBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Buscar"
        component={BuscarAdvogadosScreen}
        options={{ title: 'Buscar Advogados', tabBarLabel: 'Buscar' }}
      />
      <Tab.Screen
        name="Conexoes"
        component={MinhasConexoesScreen}
        options={{ title: 'Meus Advogados', tabBarLabel: 'Meus Advogados' }}
      />
    </Tab.Navigator>
  );
}

function AdvogadoTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1E3A5F',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { paddingBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Perfil"
        component={PerfilAdvogadoScreen}
        options={{ title: 'Meu Perfil', tabBarLabel: 'Perfil' }}
      />
      <Tab.Screen
        name="Clientes"
        component={ClientesAdvogadoScreen}
        options={{ title: 'Meus Clientes', tabBarLabel: 'Clientes' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { token, tipo, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!token ? (
        <AuthStack />
      ) : tipo === 'advogado' ? (
        <AdvogadoTabs />
      ) : (
        <ClienteTabs />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
