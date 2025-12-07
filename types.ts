export interface WordItem {
  id: string;
  level: number;
  word: string;
  pos: string;
  chinese: string;
}

export enum AppScreen {
  DASHBOARD = 'DASHBOARD',
  QUIZ = 'QUIZ',
  RESULT = 'RESULT',
  REVIEW = 'REVIEW',
  WRONG_LIST = 'WRONG_LIST',
  IMPORT = 'IMPORT',
  PK_LOBBY = 'PK_LOBBY',
  PK_BATTLE = 'PK_BATTLE'
}

export interface QuizState {
  currentWordIndex: number;
  score: number;
  totalQuestions: number;
  wrongAnswers: WordItem[];
  correctAnswers: WordItem[];
  queue: WordItem[];
}

export enum StorageKeys {
  WRONG_WORDS = 'vocab_master_wrong_words',
  MASTERED_WORDS = 'vocab_master_mastered_words',
  HISTORY = 'vocab_master_history',
  CUSTOM_DATA = 'vocab_master_custom_data'
}

// Multiplayer Types
export interface PKPlayerState {
    score: number;
    currentIndex: number;
    isFinished: boolean;
}

export interface PKGameSettings {
    level: number;
    questionCount: number;
}