/**
 * Экран загрузки текстов
 * Позволяет загрузить .txt файл или ввести текст вручную
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { colors, typography, theme } from '../theme';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import Card from '../components/Card';
import { saveText, getTexts, deleteText } from '../services/storageService';

const CATEGORIES = [
  { label: 'Информатика', value: 'informatics' },
  { label: 'Лингвистика', value: 'linguistics' },
  { label: 'Медицина', value: 'medicine' },
];

export default function TextLoadScreen({ navigation }) {
  const [texts, setTexts] = useState([]);
  const [manualText, setManualText] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('informatics');
  const [loading, setLoading] = useState(false);
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
      Alert.alert('Ошибка', 'Не удалось загрузить тексты');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTexts();
    setRefreshing(false);
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const fileName = result.assets[0].name || 'text.txt';

      await saveText({
        title: fileName.replace('.txt', ''),
        content: fileContent,
        category,
        source: 'file',
      });

      Alert.alert('Успех', 'Текст успешно загружен');
      setManualText('');
      setTitle('');
      loadTexts();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить файл');
      console.error(error);
    }
  };

  const handleManualSave = async () => {
    if (!manualText.trim()) {
      Alert.alert('Ошибка', 'Введите текст');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Ошибка', 'Введите название текста');
      return;
    }

    setLoading(true);
    try {
      await saveText({
        title: title.trim(),
        content: manualText.trim(),
        category,
        source: 'manual',
      });

      Alert.alert('Успех', 'Текст успешно сохранен');
      setManualText('');
      setTitle('');
      loadTexts();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить текст');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Удаление', 'Вы уверены, что хотите удалить этот текст?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteText(id);
            loadTexts();
          } catch (error) {
            Alert.alert('Ошибка', 'Не удалось удалить текст');
          }
        },
      },
    ]);
  };

  const handleTextPress = (text) => {
    navigation.navigate('FrequencyAnalysisFromTexts', { textId: text.id });
  };

  const renderTextItem = ({ item }) => (
    <Card style={styles.textCard}>
      <TouchableOpacity onPress={() => handleTextPress(item)}>
        <View style={styles.textHeader}>
          <View style={styles.textInfo}>
            <Text style={styles.textTitle}>{item.title}</Text>
            <Text style={styles.textCategory}>
              {CATEGORIES.find(c => c.value === item.category)?.label || item.category}
            </Text>
            <Text style={styles.textMeta}>
              {item.content.length} символов • {new Date(item.createdAt).toLocaleDateString('ru-RU')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <Text style={styles.sectionTitle}>Загрузить файл</Text>
        <Button
          title="Выбрать .txt файл"
          onPress={handleFilePick}
          style={styles.button}
        />

        <Text style={styles.sectionTitle}>Или ввести вручную</Text>
        <Card>
          <TextInput
            placeholder="Название текста"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <TextInput
            placeholder="Введите текст для анализа..."
            value={manualText}
            onChangeText={setManualText}
            multiline
            numberOfLines={8}
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
          />
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>Категория:</Text>
            <View style={styles.categoryButtons}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    category === cat.value && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat.value && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Button
            title="Сохранить текст"
            onPress={handleManualSave}
            loading={loading}
            style={styles.saveButton}
          />
        </Card>

        <Text style={styles.sectionTitle}>Сохраненные тексты</Text>
        {texts.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Нет сохраненных текстов</Text>
          </Card>
        ) : (
          <View>
            {texts.map((item) => (
              <View key={item.id}>
                {renderTextItem({ item })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  button: {
    marginBottom: theme.spacing.lg,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  textArea: {
    minHeight: 150,
    paddingTop: 12,
  },
  categoryContainer: {
    marginBottom: theme.spacing.md,
  },
  categoryLabel: {
    ...typography.label,
    marginBottom: theme.spacing.sm,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  categoryButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceLight,
  },
  categoryButtonText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  categoryButtonTextActive: {
    color: colors.accent,
  },
  saveButton: {
    marginTop: theme.spacing.sm,
  },
  textCard: {
    marginBottom: theme.spacing.sm,
  },
  textHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textInfo: {
    flex: 1,
  },
  textTitle: {
    ...typography.h3,
    marginBottom: 4,
  },
  textCategory: {
    ...typography.bodySmall,
    color: colors.accent,
    marginBottom: 4,
  },
  textMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: theme.spacing.md,
  },
});


