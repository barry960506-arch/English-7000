import React, { useMemo } from 'react';
import { WordItem, StorageKeys } from '../types';
import { hasCustomData } from '../services/dataProcessor';

interface Props {
  allWords: WordItem[];
  onStartQuiz: (words: WordItem[]) => void;
  onReviewWrong: (words: WordItem[]) => void;
  onViewWrongList: () => void;
  onImport: () => void;
  onStartPK: () => void;
}

export const Dashboard: React.FC<Props> = ({ allWords, onStartQuiz, onReviewWrong, onViewWrongList, onImport, onStartPK }) => {
  
  const levels = useMemo(() => {
    const s = new Set<number>();
    allWords.forEach(w => s.add(w.level));
    return Array.from(s).sort((a, b) => a - b);
  }, [allWords]);

  const getSavedWrongWords = (): WordItem[] => {
    try {
      const saved = localStorage.getItem(StorageKeys.WRONG_WORDS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const getHistoryIds = (): Set<string> => {
    try {
      const saved = localStorage.getItem(StorageKeys.HISTORY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  };

  const savedCount = getSavedWrongWords().length;
  const historyIds = getHistoryIds();
  const isCustom = hasCustomData();

  const handleLevelClick = (level: number) => {
    const wordsInLevel = allWords.filter(w => w.level === level);
    const history = getHistoryIds(); // Fetch fresh history

    const unseenWords = wordsInLevel.filter(w => !history.has(w.id));
    const seenWords = wordsInLevel.filter(w => history.has(w.id));
    
    let quizSet: WordItem[] = [];

    // Prioritize unseen words
    if (unseenWords.length >= 20) {
      // If enough unseen, just use them
      quizSet = unseenWords.sort(() => 0.5 - Math.random()).slice(0, 20);
    } else {
      // If not enough unseen, take all unseen and fill rest with random seen words
      const shuffledSeen = seenWords.sort(() => 0.5 - Math.random());
      quizSet = [...unseenWords, ...shuffledSeen.slice(0, 20 - unseenWords.length)];
      // Shuffle the final mix so unseen aren't always first
      quizSet = quizSet.sort(() => 0.5 - Math.random());
    }

    onStartQuiz(quizSet);
  };

  const handleReviewClick = () => {
    const wrongWords = getSavedWrongWords();
    if (wrongWords.length === 0) {
      alert("目前沒有錯題紀錄！做得好！");
      return;
    }
    // Shuffle wrong words
    onReviewWrong([...wrongWords].sort(() => 0.5 - Math.random()));
  };

  return (
    <div className="max-w-md mx-auto p-6 flex flex-col min-h-screen">
      <div className="text-center mb-8 relative">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">VocabMaster</h1>
        <p className="text-gray-500 mb-4">大考中心單字記憶助手</p>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full ${isCustom ? 'bg-secondary' : 'bg-gray-400'}`}></span>
            {isCustom ? '自訂題庫' : '預設題庫'} ({allWords.length} 字)
        </div>
        
        <button 
            onClick={onImport}
            className="absolute right-0 top-0 p-2 text-gray-400 hover:text-primary transition-colors"
            title="匯入/管理單字"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </button>
      </div>

      {/* PK Mode Button */}
      <div className="mb-6">
        <button
            onClick={onStartPK}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transform transition hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
            <span className="text-2xl">⚔️</span>
            <div className="text-left">
                <div className="text-lg leading-tight">單字對決 (PK)</div>
                <div className="text-xs font-normal opacity-80">與朋友連線比賽</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-auto opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {levels.map(level => {
          const levelWords = allWords.filter(w => w.level === level);
          const totalCount = levelWords.length;
          const seenCount = levelWords.filter(w => historyIds.has(w.id)).length;
          const percentage = totalCount > 0 ? Math.round((seenCount / totalCount) * 100) : 0;

          return (
            <button
              key={level}
              onClick={() => handleLevelClick(level)}
              className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary hover:bg-gray-50 transition-all duration-200 flex flex-col items-center justify-between group min-h-[120px]"
            >
              <div className="flex flex-col items-center mb-3">
                <span className="text-2xl font-bold text-gray-400 group-hover:text-primary transition-colors">{level}</span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider group-hover:text-primary/70">Level</span>
              </div>
              
              <div className="w-full">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5 px-1">
                    <span>{seenCount} 已做</span>
                    <span>{totalCount - seenCount} 剩餘</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className="bg-primary h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-auto space-y-3 pb-6">
        <button
          onClick={handleReviewClick}
          className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transform transition hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          複習錯題 ({savedCount})
        </button>
        
        <button
          onClick={onViewWrongList}
          className="w-full bg-white text-gray-600 font-bold py-3 px-6 rounded-2xl border border-gray-200 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          查看錯題列表
        </button>
      </div>
    </div>
  );
};