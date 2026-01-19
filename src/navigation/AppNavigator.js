/**
 * Главная навигация приложения
 * Использует Tab Navigator для основных экранов
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Экран загрузки текстов
import TextLoadScreen from '../screens/TextLoadScreen';
import TextSelectScreen from '../screens/TextSelectScreen';

// Экраны анализа
import FrequencyAnalysisScreen from '../screens/FrequencyAnalysisScreen';
import TerminologyScreen from '../screens/TerminologyScreen';
import ProperNounsScreen from '../screens/ProperNounsScreen';
import ConcordanceScreen from '../screens/ConcordanceScreen';
import DictionaryScreen from '../screens/DictionaryScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack для экрана загрузки текстов
function TextsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="TextLoad"
        component={TextLoadScreen}
        options={{ title: 'Загрузка текстов', headerShown: false }}
      />
      <Stack.Screen
        name="FrequencyAnalysisFromTexts"
        component={FrequencyAnalysisScreen}
        options={{ title: 'Частотный анализ' }}
      />
      <Stack.Screen
        name="TerminologyFromTexts"
        component={TerminologyScreen}
        options={{ title: 'Терминологический указатель' }}
      />
      <Stack.Screen
        name="ProperNounsFromTexts"
        component={ProperNounsScreen}
        options={{ title: 'Именной указатель' }}
      />
      <Stack.Screen
        name="ConcordanceFromTexts"
        component={ConcordanceScreen}
        options={{ title: 'Конкорданс' }}
      />
      <Stack.Screen
        name="DictionaryFromTexts"
        component={DictionaryScreen}
        options={{ title: 'Словарь определений' }}
      />
    </Stack.Navigator>
  );
}

// Stack для экранов анализа с выбором текста
function createAnalysisStack(ScreenComponent, screenName, title) {
  return function AnalysisStack() {
    return (
      <Stack.Navigator
        initialRouteName="TextSelect"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="TextSelect"
          component={TextSelectScreen}
          options={{ title: 'Выбор текста', headerShown: false }}
          initialParams={{ returnScreen: screenName }}
        />
        <Stack.Screen
          name={screenName}
          component={ScreenComponent}
          options={{ title }}
        />
      </Stack.Navigator>
    );
  };
}

// Главные вкладки
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Texts') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Frequency') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Terminology') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'ProperNouns') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Concordance') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Dictionary') {
            iconName = focused ? 'book' : 'book-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Texts"
        component={TextsStack}
        options={{ title: 'Тексты' }}
      />
      <Tab.Screen
        name="Frequency"
        component={createAnalysisStack(FrequencyAnalysisScreen, 'FrequencyAnalysis', 'Частотный анализ')}
        options={{ title: 'Частота' }}
      />
      <Tab.Screen
        name="Terminology"
        component={createAnalysisStack(TerminologyScreen, 'Terminology', 'Терминологический указатель')}
        options={{ title: 'Термины' }}
      />
      <Tab.Screen
        name="ProperNouns"
        component={createAnalysisStack(ProperNounsScreen, 'ProperNouns', 'Именной указатель')}
        options={{ title: 'Имена' }}
      />
      <Tab.Screen
        name="Concordance"
        component={createAnalysisStack(ConcordanceScreen, 'Concordance', 'Конкорданс')}
        options={{ title: 'Конкорданс' }}
      />
      <Tab.Screen
        name="Dictionary"
        component={createAnalysisStack(DictionaryScreen, 'Dictionary', 'Словарь определений')}
        options={{ title: 'Словарь' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}
