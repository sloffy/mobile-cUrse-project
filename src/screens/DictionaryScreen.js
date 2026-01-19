/**
 * Экран словаря определений
 * Создание и редактирование словарных статей
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
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
import { saveDictionary, getDictionaryByTextId } from '../services/storageService';
import { getTerminologyByTextId } from '../services/storageService';
import { getConcordanceByTextId } from '../services/storageService';

export default function DictionaryScreen({ route, navigation }) {
  const { textId } = route.params || {};
  const [text, setText] = useState(null);
  const [terms, setTerms] = useState([]);
  const [concordance, setConcordance] = useState({});
  const [dictionary, setDictionary] = useState({});
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPhrase, setNewPhrase] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' или 'withDefinitions'

  useEffect(() => {
    if (textId) {
      loadData();
    } else {
      navigation.navigate('TextSelect', { 
        returnScreen: 'Dictionary',
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

      // Загружаем конкорданс
      const savedConcordance = await getConcordanceByTextId(textId);
      setConcordance(savedConcordance || {});

      // Загружаем словарь
      const savedDictionary = await getDictionaryByTextId(textId);
      setDictionary(savedDictionary || {});
    } catch (error) {
      console.error('Error loading dictionary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTermSelect = (term) => {
    // Если словарной статьи еще нет, создаем пустую
    if (!dictionary[term]) {
      const contexts = concordance[term] || [];
      const examples = contexts.slice(0, 3).map(c => c.context);
      
      dictionary[term] = {
        term,
        definition: '',
        relatedPhrases: [],
        examples: examples,
      };
      setDictionary({ ...dictionary });
    }
    
    setSelectedTerm(term);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!selectedTerm) return;
    
    saveDictionaryData();
    setModalVisible(false);
  };

  const saveDictionaryData = async () => {
    try {
      await saveDictionary(textId, dictionary);
    } catch (error) {
      console.error('Error saving dictionary:', error);
    }
  };

  const updateDefinition = (term, field, value) => {
    if (!dictionary[term]) {
      dictionary[term] = {
        term,
        definition: '',
        relatedPhrases: [],
        examples: [],
      };
    }
    
    dictionary[term][field] = value;
    setDictionary({ ...dictionary });
  };

  const addRelatedPhrase = (term, phrase) => {
    if (!phrase.trim()) return;
    
    if (!dictionary[term]) {
      dictionary[term] = {
        term,
        definition: '',
        relatedPhrases: [],
        examples: [],
      };
    }
    
    if (!dictionary[term].relatedPhrases.includes(phrase.trim())) {
      dictionary[term].relatedPhrases.push(phrase.trim());
      setDictionary({ ...dictionary });
    }
  };

  const removeRelatedPhrase = (term, phrase) => {
    if (dictionary[term]) {
      dictionary[term].relatedPhrases = dictionary[term].relatedPhrases.filter(
        p => p !== phrase
      );
      setDictionary({ ...dictionary });
    }
  };

  const dictionaryEntries = Object.values(dictionary || {}).filter(
    entry => entry && entry.definition && typeof entry.definition === 'string' && entry.definition.trim().length > 0
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Фильтруем данные в зависимости от выбранной вкладки
  const getFilteredData = () => {
    if (activeTab === 'withDefinitions') {
      // Показываем только термины с определениями
      // Возвращаем полные объекты из dictionaryEntries
      return dictionaryEntries.map(entry => ({
        ...entry,
        // Убеждаемся, что relatedPhrases всегда массив
        relatedPhrases: entry.relatedPhrases || [],
      }));
    } else {
      // Показываем все термины
      return terms || [];
    }
  };

  const filteredData = getFilteredData();

  const renderTermItem = ({ item }) => {
    const hasEntry = dictionary[item.term] && dictionary[item.term].definition;
    return (
      <TouchableOpacity
        onPress={() => handleTermSelect(item.term)}
        style={styles.termItem}
      >
        <View style={styles.termRow}>
          <View style={styles.termInfo}>
            <Text style={styles.termText}>{item.term}</Text>
            {hasEntry && (
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.statusText}>Определение добавлено</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderDictionaryEntry = ({ item }) => {
    const relatedPhrases = item.relatedPhrases || [];
    return (
      <Card style={styles.entryCard}>
        <TouchableOpacity onPress={() => handleTermSelect(item.term)}>
          <Text style={styles.entryTerm}>{item.term}</Text>
          <Text style={styles.entryDefinition} numberOfLines={2}>
            {item.definition || ''}
          </Text>
          {relatedPhrases.length > 0 && (
            <View style={styles.relatedPhrases}>
              <Text style={styles.relatedLabel}>Связанные:</Text>
              <Text style={styles.relatedText}>
                {relatedPhrases.join(', ')}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Загрузка словаря...</Text>
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

  const currentEntry = selectedTerm ? dictionary[selectedTerm] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{text.title}</Text>
        <Text style={styles.subtitle}>
          Словарь определений ({dictionaryEntries.length} статей)
        </Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            Все термины
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'withDefinitions' && styles.tabActive]}
          onPress={() => setActiveTab('withDefinitions')}
        >
          <Text style={[styles.tabText, activeTab === 'withDefinitions' && styles.tabTextActive]}>
            С определениями ({dictionaryEntries.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredData}
        renderItem={activeTab === 'withDefinitions' ? renderDictionaryEntry : renderTermItem}
        keyExtractor={(item, index) => `${item.term}-${index}`}
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
            <Text style={styles.emptyText}>
              {activeTab === 'withDefinitions' 
                ? 'Нет терминов с определениями' 
                : 'Нет терминов'}
            </Text>
          </Card>
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {selectedTerm ? `Определение для "${selectedTerm}"` : ''}
              </Text>

              <Text style={styles.label}>Определение:</Text>
              <TextInput
                placeholder="Введите определение термина..."
                value={currentEntry?.definition || ''}
                onChangeText={(text) => updateDefinition(selectedTerm, 'definition', text)}
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textArea]}
                textAlignVertical="top"
              />

              <Text style={styles.label}>Связанные словосочетания:</Text>
              <View style={styles.relatedContainer}>
                {currentEntry?.relatedPhrases?.map((phrase, index) => (
                  <View key={index} style={styles.phraseTag}>
                    <Text style={styles.phraseText}>{phrase}</Text>
                    <TouchableOpacity
                      onPress={() => removeRelatedPhrase(selectedTerm, phrase)}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.addPhraseContainer}>
                <TextInput
                  placeholder="Добавить словосочетание..."
                  value={newPhrase}
                  onChangeText={setNewPhrase}
                  style={[styles.input, styles.phraseInput]}
                  onSubmitEditing={() => {
                    addRelatedPhrase(selectedTerm, newPhrase);
                    setNewPhrase('');
                  }}
                />
                <Button
                  title="Добавить"
                  onPress={() => {
                    addRelatedPhrase(selectedTerm, newPhrase);
                    setNewPhrase('');
                  }}
                  style={styles.addPhraseButton}
                />
              </View>

              <Text style={styles.label}>Примеры употребления:</Text>
              {currentEntry?.examples?.map((example, index) => (
                <Card key={index} style={styles.exampleCard}>
                  <Text style={styles.exampleText}>{example}</Text>
                </Card>
              ))}

              <View style={styles.modalButtons}>
                <Button
                  title="Сохранить"
                  onPress={handleSave}
                  style={styles.modalButton}
                />
                <Button
                  title="Отмена"
                  onPress={() => setModalVisible(false)}
                  style={[styles.modalButton, styles.cancelButton]}
                  textStyle={{ color: colors.textSecondary }}
                />
              </View>
            </ScrollView>
          </Card>
        </View>
      </Modal>
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  list: {
    padding: theme.spacing.md,
  },
  termItem: {
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  termInfo: {
    flex: 1,
  },
  termText: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.success,
  },
  entryCard: {
    marginBottom: theme.spacing.md,
  },
  entryTerm: {
    ...typography.h3,
    marginBottom: theme.spacing.sm,
  },
  entryDefinition: {
    ...typography.body,
    marginBottom: theme.spacing.sm,
  },
  relatedPhrases: {
    marginTop: theme.spacing.sm,
  },
  relatedLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  relatedText: {
    ...typography.bodySmall,
    color: colors.accent,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: theme.spacing.md,
  },
  label: {
    ...typography.label,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  relatedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  phraseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: theme.spacing.xs,
  },
  phraseText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  addPhraseContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  phraseInput: {
    flex: 1,
  },
  addPhraseButton: {
    minWidth: 100,
  },
  exampleCard: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  exampleText: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
  cancelButton: {
    borderColor: colors.border,
  },
});

