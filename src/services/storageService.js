/**
 * Сервис для работы с локальным хранилищем (AsyncStorage)
 * Хранит тексты, результаты анализа и словарь определений
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  TEXTS: '@texts',
  ANALYSES: '@analyses',
  TERMINOLOGY: '@terminology',
  PROPER_NOUNS: '@proper_nouns',
  CONCORDANCE: '@concordance',
  DICTIONARY: '@dictionary',
};

/**
 * Сохранение текста
 */
export async function saveText(textData) {
  try {
    const texts = await getTexts();
    const newText = {
      id: Date.now().toString(),
      ...textData,
      createdAt: new Date().toISOString(),
    };
    texts.push(newText);
    await AsyncStorage.setItem(STORAGE_KEYS.TEXTS, JSON.stringify(texts));
    return newText;
  } catch (error) {
    console.error('Error saving text:', error);
    throw error;
  }
}

/**
 * Получение всех текстов
 */
export async function getTexts() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TEXTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting texts:', error);
    return [];
  }
}

/**
 * Получение текста по ID
 */
export async function getTextById(id) {
  try {
    const texts = await getTexts();
    return texts.find(text => text.id === id);
  } catch (error) {
    console.error('Error getting text by id:', error);
    return null;
  }
}

/**
 * Удаление текста
 */
export async function deleteText(id) {
  try {
    const texts = await getTexts();
    const filtered = texts.filter(text => text.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.TEXTS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting text:', error);
    throw error;
  }
}

/**
 * Сохранение результатов анализа
 */
export async function saveAnalysis(textId, analysisData) {
  try {
    const analyses = await getAnalyses();
    const existingIndex = analyses.findIndex(a => a.textId === textId);
    
    const analysis = {
      textId,
      ...analysisData,
      updatedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      analyses[existingIndex] = analysis;
    } else {
      analyses.push(analysis);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(analyses));
    return analysis;
  } catch (error) {
    console.error('Error saving analysis:', error);
    throw error;
  }
}

/**
 * Получение анализа по ID текста
 */
export async function getAnalysisByTextId(textId) {
  try {
    const analyses = await getAnalyses();
    return analyses.find(a => a.textId === textId);
  } catch (error) {
    console.error('Error getting analysis:', error);
    return null;
  }
}

/**
 * Получение всех анализов
 */
export async function getAnalyses() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ANALYSES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting analyses:', error);
    return [];
  }
}

/**
 * Сохранение терминологического указателя
 */
export async function saveTerminology(textId, terms) {
  try {
    const terminology = await getTerminology();
    const existingIndex = terminology.findIndex(t => t.textId === textId);
    
    const termData = {
      textId,
      terms,
      updatedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      terminology[existingIndex] = termData;
    } else {
      terminology.push(termData);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.TERMINOLOGY, JSON.stringify(terminology));
    return termData;
  } catch (error) {
    console.error('Error saving terminology:', error);
    throw error;
  }
}

/**
 * Получение терминологического указателя по ID текста
 */
export async function getTerminologyByTextId(textId) {
  try {
    const terminology = await getTerminology();
    const termData = terminology.find(t => t.textId === textId);
    return termData ? termData.terms : [];
  } catch (error) {
    console.error('Error getting terminology:', error);
    return [];
  }
}

/**
 * Получение всех терминологических указателей
 */
export async function getTerminology() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TERMINOLOGY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting terminology:', error);
    return [];
  }
}

/**
 * Сохранение именного указателя
 */
export async function saveProperNouns(textId, nouns) {
  try {
    const properNouns = await getProperNouns();
    const existingIndex = properNouns.findIndex(p => p.textId === textId);
    
    const nounData = {
      textId,
      nouns,
      updatedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      properNouns[existingIndex] = nounData;
    } else {
      properNouns.push(nounData);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.PROPER_NOUNS, JSON.stringify(properNouns));
    return nounData;
  } catch (error) {
    console.error('Error saving proper nouns:', error);
    throw error;
  }
}

/**
 * Получение именного указателя по ID текста
 */
export async function getProperNounsByTextId(textId) {
  try {
    const properNouns = await getProperNouns();
    const nounData = properNouns.find(p => p.textId === textId);
    return nounData ? nounData.nouns : [];
  } catch (error) {
    console.error('Error getting proper nouns:', error);
    return [];
  }
}

/**
 * Получение всех именных указателей
 */
export async function getProperNouns() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PROPER_NOUNS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting proper nouns:', error);
    return [];
  }
}

/**
 * Сохранение конкорданса
 */
export async function saveConcordance(textId, concordance) {
  try {
    const concordances = await getConcordance();
    const existingIndex = concordances.findIndex(c => c.textId === textId);
    
    const concordanceData = {
      textId,
      concordance,
      updatedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      concordances[existingIndex] = concordanceData;
    } else {
      concordances.push(concordanceData);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.CONCORDANCE, JSON.stringify(concordances));
    return concordanceData;
  } catch (error) {
    console.error('Error saving concordance:', error);
    throw error;
  }
}

/**
 * Получение конкорданса по ID текста
 */
export async function getConcordanceByTextId(textId) {
  try {
    const concordances = await getConcordance();
    const concordanceData = concordances.find(c => c.textId === textId);
    return concordanceData ? concordanceData.concordance : {};
  } catch (error) {
    console.error('Error getting concordance:', error);
    return {};
  }
}

/**
 * Получение всех конкордансов
 */
export async function getConcordance() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CONCORDANCE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting concordance:', error);
    return [];
  }
}

/**
 * Сохранение словаря определений
 */
export async function saveDictionary(textId, dictionary) {
  try {
    const dictionaries = await getDictionary();
    const existingIndex = dictionaries.findIndex(d => d.textId === textId);
    
    const dictionaryData = {
      textId,
      dictionary,
      updatedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      dictionaries[existingIndex] = dictionaryData;
    } else {
      dictionaries.push(dictionaryData);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.DICTIONARY, JSON.stringify(dictionaries));
    return dictionaryData;
  } catch (error) {
    console.error('Error saving dictionary:', error);
    throw error;
  }
}

/**
 * Получение словаря определений по ID текста
 */
export async function getDictionaryByTextId(textId) {
  try {
    const dictionaries = await getDictionary();
    const dictionaryData = dictionaries.find(d => d.textId === textId);
    return dictionaryData ? dictionaryData.dictionary : {};
  } catch (error) {
    console.error('Error getting dictionary:', error);
    return {};
  }
}

/**
 * Получение всех словарей
 */
export async function getDictionary() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DICTIONARY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting dictionary:', error);
    return [];
  }
}


