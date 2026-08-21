import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  HomeTab: undefined;
  SavedTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  RecipeDetail: { slug: string };
  CookMode: { slug: string };
};

export type RootParamList = AuthStackParamList & HomeStackParamList & AppTabParamList;

export type LoginScreenProps      = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps   = NativeStackScreenProps<AuthStackParamList, 'Register'>;
export type HomeScreenProps       = NativeStackScreenProps<HomeStackParamList, 'Home'>;
export type RecipeDetailProps     = NativeStackScreenProps<HomeStackParamList, 'RecipeDetail'>;
export type CookModeProps         = NativeStackScreenProps<HomeStackParamList, 'CookMode'>;
