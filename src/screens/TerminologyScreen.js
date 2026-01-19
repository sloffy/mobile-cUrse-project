/**
 * Экран терминологического указателя
 * Автоматическое формирование списка терминов с возможностью редактирования
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
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
import { saveTerminology, getTerminologyByTextId } from '../services/storageService';
import { findTerms } from '../utils/textAnalysis';

export default function TerminologyScreen({ route, navigation }) {
  const { textId } = route.params || {};
  const [text, setText] = useState(null);
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTerm, setEditingTerm] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (textId) {
      loadData();
    } else {
      navigation.navigate('TextSelect', { 
        returnScreen: 'Terminology',
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

      // Проверяем, есть ли сохраненный терминологический указатель
      let savedTerms = await getTerminologyByTextId(textId);
      
      if (!savedTerms || savedTerms.length === 0) {
        // Генерируем термины автоматически
        const generatedTerms = generateTerms(textData.content);
        setTerms(generatedTerms);
        
        // Сохраняем
        await saveTerminology(textId, generatedTerms);
      } else {
        setTerms(savedTerms);
      }
    } catch (error) {
      console.error('Error loading terminology:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTerms = (content) => {
    // Используем улучшенный комбинированный алгоритм поиска терминов
    return findTerms(content);
  };

  const handleAddTerm = () => {
    if (!newTerm.trim()) {
      Alert.alert('Ошибка', 'Введите термин');
      return;
    }

    const term = {
      term: newTerm.trim(),
      type: 'manual',
      frequency: 1,
    };

    setTerms([...terms, term]);
    setNewTerm('');
    setModalVisible(false);
    saveTerms();
  };

  const handleDeleteTerm = (index) => {
    Alert.alert('Удаление', 'Удалить этот термин?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          const newTerms = terms.filter((_, i) => i !== index);
          setTerms(newTerms);
          saveTerms();
        },
      },
    ]);
  };

  const saveTerms = async () => {
    try {
      await saveTerminology(textId, terms);
    } catch (error) {
      console.error('Error saving terminology:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'word':
        return 'Слово';
      case 'phrase':
        return 'Словосочетание';
      case 'abbreviation':
        return 'Аббревиатура';
      case 'manual':
        return 'Вручную';
      default:
        return 'Неизвестно';
    }
  };

  const renderItem = ({ item, index }) => (
    <Card style={styles.termCard}>
      <View style={styles.termRow}>
        <View style={styles.termInfo}>
          <Text style={styles.termText}>{item.term}</Text>
          {item.expansion && (
            <Text style={styles.termExpansion}>{item.expansion}</Text>
          )}
          <View style={styles.termMeta}>
            <Text style={styles.termType}>{getTypeLabel(item.type)}</Text>
            {item.frequency && (
              <Text style={styles.termFrequency}>• Частота: {item.frequency}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteTerm(index)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Формирование терминологического указателя...</Text>
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
          Всего терминов: {terms.length}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Добавить термин"
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
        />
      </View>

      <FlatList
        data={terms}
        renderItem={renderItem}
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
            <Text style={styles.emptyText}>Нет терминов</Text>
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
            <Text style={styles.modalTitle}>Добавить термин</Text>
            <TextInput
              placeholder="Введите термин"
              value={newTerm}
              onChangeText={setNewTerm}
              style={styles.modalInput}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Отмена"
                onPress={() => {
                  setModalVisible(false);
                  setNewTerm('');
                }}
                style={[styles.modalButton, styles.cancelButton]}
                textStyle={{ color: colors.textSecondary }}
              />
              <Button
                title="Добавить"
                onPress={handleAddTerm}
                style={styles.modalButton}
              />
            </View>
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
  actions: {
    padding: theme.spacing.md,
  },
  addButton: {
    marginBottom: 0,
  },
  list: {
    padding: theme.spacing.md,
  },
  termCard: {
    marginBottom: theme.spacing.sm,
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  termInfo: {
    flex: 1,
  },
  termText: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: 4,
  },
  termExpansion: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  termMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termType: {
    ...typography.caption,
    color: colors.accent,
  },
  termFrequency: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  deleteButton: {
    padding: 8,
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
    maxWidth: 400,
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: theme.spacing.md,
  },
  modalInput: {
    marginBottom: theme.spacing.md,
    backgroundColor: colors.surfaceLight,
    borderColor: colors.accent,
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  cancelButton: {
    borderColor: colors.border,
  },
});

