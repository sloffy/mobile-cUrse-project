/**
 * Экран конкорданса
 * Поиск контекстов для терминов
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, theme } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import { getTextById } from '../services/storageService';
import { saveConcordance, getConcordanceByTextId } from '../services/storageService';
import { getTerminologyByTextId } from '../services/storageService';
import { findContexts } from '../utils/textAnalysis';

export default function ConcordanceScreen({ route, navigation }) {
  const { textId } = route.params || {};
  const [text, setText] = useState(null);
  const [terms, setTerms] = useState([]);
  const [concordance, setConcordance] = useState({});
  const [selectedTerm, setSelectedTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingContexts, setLoadingContexts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (textId) {
      loadData();
    } else {
      navigation.navigate('TextSelect', { 
        returnScreen: 'Concordance',
      });
    }
  }, [textId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const textData = await getTextById(textId);
      if (!textData) {
        navigation.goBack();
        return;
      }

      setText(textData);

      // Загружаем термины
      const terminology = await getTerminologyByTextId(textId);
      setTerms(terminology);

      // Загружаем сохраненный конкорданс
      const savedConcordance = await getConcordanceByTextId(textId);
      setConcordance(savedConcordance || {});
    } catch (error) {
      console.error('Error loading concordance:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateContexts = async (term) => {
    if (!text || !term) return;

    setLoadingContexts(true);
    try {
      // Ищем контексты для термина
      const contexts = findContexts(text.content, term, 5);
      
      // Обновляем конкорданс
      const newConcordance = {
        ...concordance,
        [term]: contexts,
      };
      
      setConcordance(newConcordance);
      
      // Сохраняем
      await saveConcordance(textId, newConcordance);
    } catch (error) {
      console.error('Error generating contexts:', error);
    } finally {
      setLoadingContexts(false);
    }
  };

  const handleTermSelect = (term) => {
    setSelectedTerm(term);
    
    // Если контекстов еще нет, генерируем их
    if (!concordance[term] || concordance[term].length === 0) {
      generateContexts(term);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    const term = searchQuery.trim().toLowerCase();
    handleTermSelect(term);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredTerms = terms.filter(term =>
    term.term.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentContexts = selectedTerm ? (concordance[selectedTerm] || []) : [];

  const renderTermItem = ({ item }) => {
    const hasContexts = concordance[item.term] && concordance[item.term].length > 0;
    return (
      <TouchableOpacity
        onPress={() => handleTermSelect(item.term)}
        style={[
          styles.termItem,
          selectedTerm === item.term && styles.termItemActive,
        ]}
      >
        <View style={styles.termRow}>
          <Text style={styles.termText}>{item.term}</Text>
          {hasContexts && (
            <View style={styles.contextBadge}>
              <Text style={styles.contextBadgeText}>
                {concordance[item.term].length}
              </Text>
            </View>
          )}
          {selectedTerm === item.term && (
            <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContextItem = ({ item, index }) => (
    <Card style={styles.contextCard}>
      <View style={styles.contextHeader}>
        <Text style={styles.contextNumber}>Контекст {index + 1}</Text>
      </View>
      <Text style={styles.contextText}>{item.context}</Text>
      {item.source && (
        <Text style={styles.contextSource}>Источник: {item.source}</Text>
      )}
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Загрузка конкорданса...</Text>
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
        <Text style={styles.subtitle}>Конкорданс терминов</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Поиск термина..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <Button
          title="Найти"
          onPress={handleSearch}
          style={styles.searchButton}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.termsColumn}>
          <Text style={styles.columnTitle}>Термины</Text>
          {terms.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>Нет терминов</Text>
            </Card>
          ) : (
            <FlatList
              data={filteredTerms}
              renderItem={renderTermItem}
              keyExtractor={(item, index) => `${item.term}-${index}`}
              style={styles.termsList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.accent}
                />
              }
            />
          )}
        </View>

        <View style={styles.contextsColumn}>
          <View style={styles.contextsHeaderContainer}>
            <Text style={styles.columnTitle}>
              Контексты {selectedTerm ? `для "${selectedTerm}"` : ''}
            </Text>
            {selectedTerm && (
              <View style={styles.refreshButtonContainer}>
                <Button
                  title="Обновить"
                  onPress={() => generateContexts(selectedTerm)}
                  loading={loadingContexts}
                  style={styles.refreshButton}
                />
              </View>
            )}
          </View>
          {!selectedTerm ? (
            <Card>
              <Text style={styles.emptyText}>Выберите термин для просмотра контекстов</Text>
            </Card>
          ) : loadingContexts ? (
            <View style={styles.loadingContextsContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.loadingText}>Поиск контекстов...</Text>
            </View>
          ) : currentContexts.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>Контексты не найдены</Text>
            </Card>
          ) : (
            <FlatList
              data={currentContexts}
              renderItem={renderContextItem}
              keyExtractor={(item, index) => `context-${index}`}
              style={styles.contextsList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.accent}
                />
              }
            />
          )}
        </View>
      </View>
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
  searchContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderColor: colors.accent,
    borderWidth: 1,
  },
  searchButton: {
    minWidth: 100,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  termsColumn: {
    width: '40%',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    padding: theme.spacing.md,
  },
  contextsColumn: {
    flex: 1,
    padding: theme.spacing.md,
  },
  columnTitle: {
    ...typography.h3,
    marginBottom: theme.spacing.md,
  },
  termsList: {
    flex: 1,
  },
  termItem: {
    padding: theme.spacing.sm,
    borderRadius: 8,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  termItemActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceLight,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  termText: {
    ...typography.body,
    flex: 1,
  },
  contextBadge: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: theme.spacing.xs,
  },
  contextBadgeText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  contextsHeaderContainer: {
    marginBottom: theme.spacing.md,
  },
  contextsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  refreshButtonContainer: {
    marginTop: theme.spacing.sm,
    width: '100%',
  },
  refreshButton: {
    width: '100%',
  },
  contextsList: {
    flex: 1,
  },
  contextCard: {
    marginBottom: theme.spacing.md,
  },
  contextHeader: {
    marginBottom: theme.spacing.sm,
  },
  contextNumber: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  contextText: {
    ...typography.body,
    marginBottom: theme.spacing.xs,
    lineHeight: 22,
  },
  contextSource: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
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
  loadingContextsContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
});

