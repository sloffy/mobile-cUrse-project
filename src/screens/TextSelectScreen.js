/**
 * Экран выбора текста для анализа
 * Показывается, когда нужно выбрать текст для анализа
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, theme } from '../theme';
import Card from '../components/Card';
import { getTexts } from '../services/storageService';

export default function TextSelectScreen({ navigation, route, onSelect }) {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTexts();
  }, []);

  // Обновляем список при возврате на экран
  useFocusEffect(
    React.useCallback(() => {
      loadTexts();
    }, [])
  );

  const loadTexts = async () => {
    try {
      const loadedTexts = await getTexts();
      setTexts(loadedTexts);
    } catch (error) {
      console.error('Error loading texts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTexts();
    setRefreshing(false);
  };

  const handleTextSelect = (text) => {
    if (onSelect) {
      onSelect(text.id);
    } else {
      // Получаем экран, на который нужно перейти
      const returnScreen = route?.params?.returnScreen || 'FrequencyAnalysis';
      // Переходим к экрану анализа с выбранным textId
      navigation.navigate(returnScreen, { textId: text.id });
    }
  };

  const renderTextItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleTextSelect(item)}>
      <Card style={styles.textCard}>
        <Text style={styles.textTitle}>{item.title}</Text>
        <Text style={styles.textMeta}>
          {item.content.length} символов • {new Date(item.createdAt).toLocaleDateString('ru-RU')}
        </Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Выберите текст для анализа</Text>
      </View>
      {texts.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
        >
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Нет сохраненных текстов</Text>
          </Card>
        </ScrollView>
      ) : (
        <FlatList
          data={texts}
          renderItem={renderTextItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
  },
  list: {
    padding: theme.spacing.md,
  },
  textCard: {
    marginBottom: theme.spacing.sm,
  },
  textTitle: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: 4,
  },
  textMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  emptyCard: {
    margin: theme.spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: theme.spacing.md,
  },
});

