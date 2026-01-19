/**
 * Экран именного указателя
 * Поиск и категоризация имен собственных
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, theme } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import { getTextById } from '../services/storageService';
import { saveProperNouns, getProperNounsByTextId } from '../services/storageService';
import { findProperNouns } from '../utils/textAnalysis';

const CATEGORIES = [
  { label: 'Персоналии', value: 'person', icon: 'person-outline' },
  { label: 'Топонимы', value: 'location', icon: 'location-outline' },
  { label: 'Организации', value: 'organization', icon: 'business-outline' },
  { label: 'Программные продукты', value: 'software', icon: 'code-outline' },
  { label: 'Неизвестно', value: 'unknown', icon: 'help-outline' },
];

export default function ProperNounsScreen({ route, navigation }) {
  const { textId } = route.params || {};
  const [text, setText] = useState(null);
  const [nouns, setNouns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingNoun, setEditingNoun] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (textId) {
      loadData();
    } else {
      navigation.navigate('TextSelect', { 
        returnScreen: 'ProperNouns',
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

      // Проверяем, есть ли сохраненный именной указатель
      let savedNouns = await getProperNounsByTextId(textId);
      
      if (!savedNouns || savedNouns.length === 0) {
        // Генерируем имена собственные автоматически
        const foundNouns = findProperNouns(textData.content);
        setNouns(foundNouns);
        
        // Сохраняем
        await saveProperNouns(textId, foundNouns);
      } else {
        setNouns(savedNouns);
      }
    } catch (error) {
      console.error('Error loading proper nouns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (nounIndex, category) => {
    const newNouns = [...nouns];
    newNouns[nounIndex].category = category;
    setNouns(newNouns);
    saveNouns(newNouns);
    setModalVisible(false);
  };

  const saveNouns = async (nounsToSave = nouns) => {
    try {
      await saveProperNouns(textId, nounsToSave);
    } catch (error) {
      console.error('Error saving proper nouns:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCategoryLabel = (category) => {
    return CATEGORIES.find(c => c.value === category)?.label || 'Неизвестно';
  };

  const getCategoryIcon = (category) => {
    return CATEGORIES.find(c => c.value === category)?.icon || 'help-outline';
  };

  const filteredNouns = selectedCategory === 'all'
    ? nouns
    : nouns.filter(noun => noun.category === selectedCategory);

  const groupedNouns = CATEGORIES.reduce((acc, cat) => {
    if (cat.value === 'unknown') return acc;
    const categoryNouns = nouns.filter(n => n.category === cat.value);
    if (categoryNouns.length > 0) {
      acc[cat.value] = {
        label: cat.label,
        icon: cat.icon,
        nouns: categoryNouns,
      };
    }
    return acc;
  }, {});

  const renderNounItem = ({ item, index }) => {
    const originalIndex = nouns.findIndex(n => n.name === item.name);
    return (
      <Card style={styles.nounCard}>
        <View style={styles.nounRow}>
          <View style={styles.nounInfo}>
            <Text style={styles.nounName}>{item.name}</Text>
            <View style={styles.nounMeta}>
              <Ionicons
                name={getCategoryIcon(item.category)}
                size={16}
                color={colors.accent}
              />
              <Text style={styles.nounCategory}>{getCategoryLabel(item.category)}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              setEditingNoun(originalIndex);
              setModalVisible(true);
            }}
            style={styles.editButton}
          >
            <Ionicons name="pencil-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderCategorySection = (categoryKey, categoryData) => (
    <View key={categoryKey} style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Ionicons name={categoryData.icon} size={20} color={colors.accent} />
        <Text style={styles.categoryTitle}>
          {categoryData.label} ({categoryData.nouns.length})
        </Text>
      </View>
      {categoryData.nouns.map((noun, index) => {
        const originalIndex = nouns.findIndex(n => n.name === noun.name);
        return (
          <Card key={index} style={styles.nounCard}>
            <View style={styles.nounRow}>
              <View style={styles.nounInfo}>
                <Text style={styles.nounName}>{noun.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setEditingNoun(originalIndex);
                  setModalVisible(true);
                }}
                style={styles.editButton}
              >
                <Ionicons name="pencil-outline" size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </Card>
        );
      })}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Поиск имен собственных...</Text>
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
          Всего имен собственных: {nouns.length}
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Фильтр:</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedCategory === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedCategory === 'all' && styles.filterButtonTextActive,
              ]}
            >
              Все
            </Text>
          </TouchableOpacity>
          {CATEGORIES.filter(c => c.value !== 'unknown').map(cat => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.filterButton,
                selectedCategory === cat.value && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedCategory(cat.value)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedCategory === cat.value && styles.filterButtonTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedCategory === 'all' ? (
        <FlatList
          data={Object.entries(groupedNouns)}
          renderItem={({ item }) => renderCategorySection(item[0], item[1])}
          keyExtractor={item => item[0]}
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
              <Text style={styles.emptyText}>Имена собственные не найдены</Text>
            </Card>
          }
        />
      ) : (
        <FlatList
          data={filteredNouns}
          renderItem={renderNounItem}
          keyExtractor={(item, index) => `${item.name}-${index}`}
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
              <Text style={styles.emptyText}>Нет имен в этой категории</Text>
            </Card>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Категория для "{editingNoun !== null ? nouns[editingNoun]?.name : ''}"
            </Text>
            {CATEGORIES.map(cat => (
              <Button
                key={cat.value}
                title={cat.label}
                onPress={() => handleCategoryChange(editingNoun, cat.value)}
                style={[
                  styles.categoryButton,
                  nouns[editingNoun]?.category === cat.value && styles.categoryButtonActive,
                ]}
              />
            ))}
            <Button
              title="Отмена"
              onPress={() => setModalVisible(false)}
              style={[styles.modalButton, styles.cancelButton]}
              textStyle={{ color: colors.textSecondary }}
            />
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
  filterContainer: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterLabel: {
    ...typography.label,
    marginBottom: theme.spacing.sm,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceLight,
  },
  filterButtonText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.accent,
  },
  list: {
    padding: theme.spacing.md,
  },
  categorySection: {
    marginBottom: theme.spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  categoryTitle: {
    ...typography.h3,
    marginLeft: theme.spacing.sm,
  },
  nounCard: {
    marginBottom: theme.spacing.sm,
  },
  nounRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nounInfo: {
    flex: 1,
  },
  nounName: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: 4,
  },
  nounMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  nounCategory: {
    ...typography.caption,
    color: colors.accent,
  },
  editButton: {
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
  categoryButton: {
    marginBottom: theme.spacing.sm,
  },
  categoryButtonActive: {
    backgroundColor: colors.surfaceLight,
  },
  modalButton: {
    marginTop: theme.spacing.md,
  },
  cancelButton: {
    borderColor: colors.border,
  },
});

