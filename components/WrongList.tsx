import React, { useState, useEffect } from 'react';
import { WordItem, StorageKeys } from '../types';

interface Props {
  onBack: () => void;
}

export const WrongList: React.FC<Props> = ({ onBack }) => {
  const [wrongWords, setWrongWords] = useState<WordItem[]>([]);
  const [masteredWords, setMasteredWords] = useState<WordItem[]>([]);

  useEffect(() => {
    try {
      // Load active wrong words
      const savedWrong = localStorage.getItem(StorageKeys.WRONG_WORDS);
      if (savedWrong) {
        const words: WordItem[] = JSON.parse(savedWrong);
        words.sort((a, b) => a.word.localeCompare(b.word));
        setWrongWords(words);
      }

      // Load mastered words
      const savedMastered = localStorage.getItem(StorageKeys.MASTERED_WORDS);
      if (savedMastered) {
        const words: WordItem[] = JSON.parse(savedMastered);
        words.sort((a, b) => a.word.localeCompare(b.word));
        setMasteredWords(words);
      }
    } catch (e) {
      console.error("Failed to load word lists", e);
    }
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 min-h-screen bg-white">
      <div className="flex items-center mb-6 sticky top-0 bg-white/95 backdrop-blur-sm py-2 border-b border-gray-100 z-10">
        <button 
          onClick={onBack} 
          className="mr-4 p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">錯題列表</h1>
      </div>

      <div className="space-y-8 pb-10">
        
        {/* Section 1: Active Wrong Words */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-6 bg-red-500 rounded-full mr-2"></span>
            待複習 (Pending) 
            <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">{wrongWords.length}</span>
          </h2>
          
          {wrongWords.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <span className="text-2xl block mb-2">🎉</span>
              <p className="text-gray-500 text-sm">沒有待複習的單字！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wrongWords.map((word, idx) => (
                <div key={`${word.id}-${idx}`} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-red-200 transition-colors">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-lg font-bold text-gray-800">{word.word}</span>
                    <span className="text-xs text-gray-500 italic font-serif bg-gray-100 px-2 py-0.5 rounded text-center min-w-[3rem]">{word.pos}</span>
                  </div>
                  <div className="text-gray-600 font-medium">
                    {word.chinese}
                  </div>
                  <div className="text-xs text-gray-300 mt-2 text-right">
                    Level {word.level}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Mastered Words */}
        {masteredWords.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center mt-8">
              <span className="w-2 h-6 bg-green-500 rounded-full mr-2"></span>
              已熟記 (Mastered)
              <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">{masteredWords.length}</span>
            </h2>
            
            <div className="space-y-3 opacity-75 hover:opacity-100 transition-opacity">
              {masteredWords.map((word, idx) => (
                <div key={`${word.id}-${idx}`} className="p-4 bg-green-50/50 rounded-xl border border-green-100 hover:border-green-300 transition-colors">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-lg font-bold text-green-900">{word.word}</span>
                    <span className="text-xs text-green-700/60 italic font-serif bg-green-100 px-2 py-0.5 rounded text-center min-w-[3rem]">{word.pos}</span>
                  </div>
                  <div className="text-green-800/80 font-medium">
                    {word.chinese}
                  </div>
                  <div className="text-xs text-green-700/40 mt-2 text-right">
                    Level {word.level}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};