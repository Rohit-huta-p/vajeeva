import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../auth/AuthContext';
import LoginScreen from '../auth/LoginScreen';
import RegisterScreen from '../auth/RegisterScreen';
import TabNavigator from './TabNavigator';
import type { AuthStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export default function RootNavigator() {
  const { user } = useContext(AuthContext);
  if (user) return <TabNavigator />;
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"    component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}
