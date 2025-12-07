import React, { useState, useEffect } from 'react';
import { WordItem, AppScreen } from './types';
import { getAllWords } from './services/dataProcessor';
import { Dashboard } from './components/Dashboard';
import { Quiz } from './components/Quiz';
import { WrongList } from './components/WrongList';
import { DataImport } from './components/DataImport';
import { PKLobby } from './components/PKLobby';
import { PKBattle } from './components/PKBattle';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.DASHBOARD);
  const [quizWords, setQuizWords] = useState<WordItem[]>([]);
  const [allWords, setAllWords] = useState<WordItem[]>([]);
  const [lastScore, setLastScore] = useState<{score: number, total: number} | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  
  // PK State
  const [pkConnection, setPkConnection] = useState<any>(null);
  const [isPkHost, setIsPkHost] = useState(false);

  const loadData = () => {
    const data = getAllWords();
    setAllWords(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const startQuiz = (words: WordItem[]) => {
    setQuizWords(words);
    setIsReviewing(false);
    setScreen(AppScreen.QUIZ);
  };

  const startReview = (words: WordItem[]) => {
    setQuizWords(words);
    setIsReviewing(true);
    setScreen(AppScreen.QUIZ);
  };

  const viewWrongList = () => {
    setScreen(AppScreen.WRONG_LIST);
  };

  const handleImport = () => {
    setScreen(AppScreen.IMPORT);
  };
  
  const handleStartPK = () => {
    setScreen(AppScreen.PK_LOBBY);
  };

  const handlePKGameStart = (conn: any, isHost: boolean, words: WordItem[]) => {
    setPkConnection(conn);
    setIsPkHost(isHost);
    setQuizWords(words);
    setScreen(AppScreen.PK_BATTLE);
  };

  const handleDataUpdated = () => {
    loadData();
  };

  const handleQuizFinish = (score: number, total: number) => {
    setLastScore({ score, total });
    setScreen(AppScreen.RESULT);
  };

  const handleExit = () => {
    // Close connection if open
    if (pkConnection) {
        pkConnection.close();
        setPkConnection(null);
    }
    setScreen(AppScreen.DASHBOARD);
  };

  if (screen === AppScreen.QUIZ) {
    return (
      <Quiz 
        words={quizWords} 
        onFinish={handleQuizFinish} 
        onExit={handleExit} 
        isReviewMode={isReviewing}
      />
    );
  }

  if (screen === AppScreen.RESULT) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">測驗完成!</h2>
          <div className="text-6xl font-extrabold text-primary mb-6">
            {lastScore?.score} <span className="text-2xl text-gray-400">/ {lastScore?.total}</span>
          </div>
          
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">
            {isReviewing 
              ? "答對的單字已移至「已熟記」區。" 
              : "不會的單字已經自動加入「複習錯題」中。"}
          </p>

          <button 
            onClick={() => setScreen(AppScreen.DASHBOARD)}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-colors"
          >
            回首頁
          </button>
        </div>
      </div>
    );
  }

  if (screen === AppScreen.WRONG_LIST) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WrongList onBack={handleExit} />
      </div>
    );
  }

  if (screen === AppScreen.IMPORT) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DataImport onBack={handleExit} onDataUpdated={handleDataUpdated} />
      </div>
    );
  }

  if (screen === AppScreen.PK_LOBBY) {
    return (
        <div className="min-h-screen bg-indigo-50">
            <PKLobby 
                allWords={allWords} 
                onBack={handleExit} 
                onGameStart={handlePKGameStart}
            />
        </div>
    );
  }

  if (screen === AppScreen.PK_BATTLE) {
    return (
        <div className="min-h-screen bg-gray-50">
            <PKBattle 
                connection={pkConnection}
                words={quizWords}
                isHost={isPkHost}
                onExit={handleExit}
            />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard 
        allWords={allWords} 
        onStartQuiz={startQuiz}
        onReviewWrong={startReview}
        onViewWrongList={viewWrongList}
        onImport={handleImport}
        onStartPK={handleStartPK}
      />
    </div>
  );
};

export default App;