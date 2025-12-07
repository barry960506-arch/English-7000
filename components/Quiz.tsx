import React, { useState, useEffect } from 'react';
import { WordItem, StorageKeys } from '../types';
import { getDistractors, getAllWords } from '../services/dataProcessor';
import { ProgressBar } from './ProgressBar';

interface Props {
  words: WordItem[];
  onFinish: (score: number, total: number) => void;
  onExit: () => void;
  isReviewMode?: boolean;
}

export const Quiz: React.FC<Props> = ({ words, onFinish, onExit, isReviewMode = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  
  const currentWord = words[currentIndex];

  useEffect(() => {
    // Generate options when word changes
    if (!currentWord) return;
    
    const all = getAllWords();
    const distractors = getDistractors(currentWord, all, 3);
    const allOptions = [...distractors, currentWord.chinese];
    
    // Shuffle options
    setOptions(allOptions.sort(() => 0.5 - Math.random()));
    setIsAnswered(false);
    setSelectedOption(null);
  }, [currentIndex, currentWord]);

  const addToHistory = (wordId: string) => {
    try {
        const savedHistory = localStorage.getItem(StorageKeys.HISTORY);
        const historySet = savedHistory ? new Set(JSON.parse(savedHistory)) : new Set();
        if (!historySet.has(wordId)) {
            historySet.add(wordId);
            localStorage.setItem(StorageKeys.HISTORY, JSON.stringify(Array.from(historySet)));
        }
    } catch (e) {
        console.error("Failed to save history", e);
    }
  };

  const markAsWrong = (word: WordItem) => {
    // Add to WRONG_WORDS
    const savedWrong = localStorage.getItem(StorageKeys.WRONG_WORDS);
    let wrongList: WordItem[] = savedWrong ? JSON.parse(savedWrong) : [];
    
    // Avoid duplicates in wrong list
    if (!wrongList.find(w => w.id === word.id)) {
      wrongList.push(word);
      localStorage.setItem(StorageKeys.WRONG_WORDS, JSON.stringify(wrongList));
    }

    // Remove from MASTERED_WORDS if it exists there (regression)
    const savedMastered = localStorage.getItem(StorageKeys.MASTERED_WORDS);
    if (savedMastered) {
      let masteredList: WordItem[] = JSON.parse(savedMastered);
      if (masteredList.find(w => w.id === word.id)) {
        masteredList = masteredList.filter(w => w.id !== word.id);
        localStorage.setItem(StorageKeys.MASTERED_WORDS, JSON.stringify(masteredList));
      }
    }
  };

  const moveToMastered = (word: WordItem) => {
    // Remove from WRONG_WORDS
    const savedWrong = localStorage.getItem(StorageKeys.WRONG_WORDS);
    if (savedWrong) {
      let list: WordItem[] = JSON.parse(savedWrong);
      list = list.filter(w => w.id !== word.id);
      localStorage.setItem(StorageKeys.WRONG_WORDS, JSON.stringify(list));
    }

    // Add to MASTERED_WORDS
    const savedMastered = localStorage.getItem(StorageKeys.MASTERED_WORDS);
    let masteredList: WordItem[] = savedMastered ? JSON.parse(savedMastered) : [];
    
    if (!masteredList.find(w => w.id === word.id)) {
      masteredList.push(word);
      localStorage.setItem(StorageKeys.MASTERED_WORDS, JSON.stringify(masteredList));
    }
  };

  const handleAnswer = (option: string | null) => {
    if (isAnswered) return;
    
    setIsAnswered(true);
    setSelectedOption(option);

    // Track that we have seen this word regardless of correctness
    addToHistory(currentWord.id);

    const isCorrect = option === currentWord.chinese;

    if (isCorrect) {
      setScore(prev => prev + 1);
      if (isReviewMode) {
        moveToMastered(currentWord);
      }
    } else {
      // Wrong answer or "Don't know"
      markAsWrong(currentWord);
    }

    // Delay before next question
    // If wrong, give user more time to read (2s), if correct (1s)
    const delay = isCorrect ? 800 : 2500;
    
    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onFinish(score + (isCorrect ? 1 : 0), words.length);
      }
    }, delay);
  };

  if (!currentWord) return <div>Loading...</div>;

  return (
    <div className="max-w-md mx-auto p-6 min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onExit} className="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="font-bold text-gray-400 text-sm">
            {isReviewMode ? "複習模式" : `Level ${currentWord.level}`}
        </span>
      </div>

      <ProgressBar current={currentIndex + 1} total={words.length} />

      <div className="flex-1 flex flex-col justify-center items-center mb-10">
        <div className="text-5xl font-bold text-gray-800 mb-2 text-center break-words w-full">
          {currentWord.word}
        </div>
        <div className="text-gray-500 font-medium italic bg-gray-100 px-3 py-1 rounded-full">
          {currentWord.pos}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {options.map((option, idx) => {
          let btnClass = "w-full p-4 rounded-xl text-left font-medium transition-all duration-200 border-2 ";
          
          if (isAnswered) {
            if (option === currentWord.chinese) {
              btnClass += "bg-green-100 border-green-500 text-green-700"; // Correct answer always green
            } else if (option === selectedOption) {
              btnClass += "bg-red-100 border-red-500 text-red-700"; // Wrong selection
            } else {
              btnClass += "bg-white border-gray-100 opacity-50"; // Others dimmed
            }
          } else {
            btnClass += "bg-white border-gray-100 hover:border-primary hover:bg-indigo-50 shadow-sm";
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(option)}
              disabled={isAnswered}
              className={btnClass}
            >
              {option}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => handleAnswer(null)}
        disabled={isAnswered}
        className={`w-full p-4 rounded-xl font-medium text-center transition-colors ${
          isAnswered 
            ? "text-gray-300 bg-transparent border border-transparent" 
            : "text-gray-500 bg-gray-100 hover:bg-gray-200"
        }`}
      >
        {isAnswered && selectedOption === null 
            ? "正確答案是：" + currentWord.chinese 
            : "🤔 我不確定 (Not sure)"}
      </button>
    </div>
  );
};