/**
 * Экран частотного анализа
 * Отображает частоту слов в тексте
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, theme } from '../theme';
import Card from '../components/Card';
import { getTextById } from '../services/storageService';
import { saveAnalysis, getAnalysisByTextId } from '../services/storageService';
import { frequencyAnalysis } from '../utils/textAnalysis';

export default function FrequencyAnalysisScreen({ route, navigation }) {
  const { textId } = route.params || {};
  const [text, setText] = useState(null);
  const [frequencyData, setFrequencyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (textId) {
      loadData();
    } else {
      // Если textId не передан, переходим к экрану выбора текста
      navigation.navigate('TextSelect', { 
        returnScreen: 'FrequencyAnalysis',
      });
    }
  }, [textId]);

  const loadData = async () => {
    if (!textId) {
      // Если нет textId, не пытаемся загружать данные
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const textData = await getTextById(textId);
      if (!textData) {
        // Если текст не найден, переходим к выбору текста
        navigation.navigate('TextSelect', { 
          returnScreen: 'FrequencyAnalysis',
        });
        setLoading(false);
        return;
      }

      setText(textData);

      // Проверяем, есть ли сохраненный анализ
      let analysis = await getAnalysisByTextId(textId);
      
      if (!analysis || !analysis.frequency) {
        // Выполняем анализ
        const frequency = frequencyAnalysis(textData.content);
        setFrequencyData(frequency);
        
        // Сохраняем результаты
        await saveAnalysis(textId, { frequency });
      } else {
        setFrequencyData(analysis.frequency);
      }
    } catch (error) {
      console.error('Error loading frequency analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (!textId) {
      // Если нет textId, переходим к выбору текста
      navigation.navigate('TextSelect', { 
        returnScreen: 'FrequencyAnalysis',
      });
      return;
    }
    
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderItem = ({ item, index }) => (
    <Card style={styles.frequencyItem}>
      <View style={styles.frequencyRow}>
        <View style={styles.rankContainer}>
          <Text style={styles.rank}>{index + 1}</Text>
        </View>
        <View style={styles.wordContainer}>
          <Text style={styles.word}>{item.word}</Text>
          <Text style={styles.frequency}>Частота: {item.frequency}</Text>
        </View>
        <View style={styles.barContainer}>
          <View
            style={[
              styles.frequencyBar,
              { width: `${(item.frequency / (frequencyData[0]?.frequency || 1)) * 100}%` },
            ]}
          />
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Анализ текста...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!text) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Текст не найден</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{text.title}</Text>
        <Text style={styles.subtitle}>
          Всего уникальных слов: {frequencyData.length}
        </Text>
      </View>

      <FlatList
        data={frequencyData}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.word}-${index}`}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <Card>
            <Text style={styles.emptyText}>Нет данных для отображения</Text>
          </Card>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  header: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  list: {
    padding: theme.spacing.md,
  },
  frequencyItem: {
    marginBottom: theme.spacing.sm,
  },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rank: {
    ...typography.bodySmall,
    color: colors.accent,
    fontWeight: '600',
  },
  wordContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  word: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: 4,
  },
  frequency: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  barContainer: {
    width: 80,
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: theme.spacing.md,
  },
  frequencyBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

