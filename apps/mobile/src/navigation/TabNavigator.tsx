import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import CookModeScreen from '../screens/CookModeScreen';
import SavedScreen from '../screens/SavedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import type { AppTabParamList, HomeStackParamList } from './types';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<AppTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <HomeStack.Screen name="CookMode" component={CookModeScreen}
        options={{ presentation: 'fullScreenModal' }} />
    </HomeStack.Navigator>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bone, borderTopColor: colors.line },
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
      }}>
      <Tab.Screen name="HomeTab"    component={HomeNavigator} options={{ title: 'Browse' }} />
      <Tab.Screen name="SavedTab"   component={SavedScreen}   options={{ title: 'Saved' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
