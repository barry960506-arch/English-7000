import React, { useState, useEffect, useRef } from 'react';
import { WordItem } from '../types';
import { getDistractors, getAllWords } from '../services/dataProcessor';

interface Props {
  connection: any;
  words: WordItem[];
  isHost: boolean;
  onExit: () => void;
}

type Phase = 'countdown' | 'fighting' | 'revealing' | 'finished';

const ROUND_TIME = 8; // seconds

export const PKBattle: React.FC<Props> = ({ connection, words, isHost, onExit }) => {
  // Game State
  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState<number>(3);
  const [roundTimer, setRoundTimer] = useState(ROUND_TIME);
  
  // Round State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  
  // My State
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Opponent State
  const [oppScore, setOppScore] = useState(0);

  const currentWord = words[currentIndex];
  const timerRef = useRef<any>(null);

  // --- PREPARE OPTIONS ---
  useEffect(() => {
    if (!currentWord) return;
    const all = getAllWords();
    const distractors = getDistractors(currentWord, all, 3);
    const allOptions = [...distractors, currentWord.chinese].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
  }, [currentIndex, currentWord]);


  // --- HOST GAME LOOP ---
  useEffect(() => {
    if (!isHost || !connection) return;

    let timeout: any;

    const runGameLoop = async () => {
        if (phase === 'countdown') {
             // 3..2..1 handled by local effect below
        } else if (phase === 'fighting') {
             // Host sends ROUND_START
             connection.send({ type: 'ROUND_START', index: currentIndex });
             
             // Wait for ROUND_TIME
             timeout = setTimeout(() => {
                 setPhase('revealing');
             }, ROUND_TIME * 1000);

        } else if (phase === 'revealing') {
             // Host sends ROUND_END
             connection.send({ type: 'ROUND_END' });
             
             // Wait 2s then next round
             timeout = setTimeout(() => {
                 if (currentIndex < words.length - 1) {
                     setCurrentIndex(prev => prev + 1);
                     setPhase('fighting');
                 } else {
                     setPhase('finished');
                     connection.send({ type: 'GAME_OVER', finalScore: score }); // Send my score final check
                 }
             }, 2000);
        }
    };

    runGameLoop();

    return () => clearTimeout(timeout);
  }, [phase, currentIndex, isHost, connection, words.length]);


  // --- LOCAL COUNTDOWN & TIMER ---
  useEffect(() => {
    if (phase === 'countdown') {
        if (countdown > 0) {
            const t = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(t);
        } else {
            // Start Game
            if (isHost) setPhase('fighting');
        }
    }
  }, [countdown, phase, isHost]);

  // Visual Timer for 8s
  useEffect(() => {
      if (phase === 'fighting') {
          setRoundTimer(ROUND_TIME);
          const t = setInterval(() => {
              setRoundTimer(prev => Math.max(0, prev - 0.1));
          }, 100);
          timerRef.current = t;
          return () => clearInterval(t);
      } else {
          if (timerRef.current) clearInterval(timerRef.current);
          setRoundTimer(0);
      }
  }, [phase]);


  // --- NETWORK LISTENERS (GUEST) ---
  useEffect(() => {
    if (!connection) return;

    connection.on('data', (data: any) => {
      // Common events
      if (data.type === 'UPDATE_SCORE') {
        setOppScore(data.score);
      }

      // Guest events
      if (!isHost) {
          if (data.type === 'ROUND_START') {
              setCurrentIndex(data.index);
              setPhase('fighting');
              // Reset local round state
              setIsAnswered(false);
              setSelectedOption(null);
          }
          if (data.type === 'ROUND_END') {
              setPhase('revealing');
          }
          if (data.type === 'GAME_OVER') {
              setPhase('finished');
              // Optionally sync final score if sent
              if (data.finalScore !== undefined) setOppScore(data.finalScore);
          }
      } else {
          // Host specific: listener for Game Over confirmation if needed?
          // For now mainly listening for score updates from guest
      }
    });

    connection.on('close', () => {
      alert("對手已斷線！");
      onExit();
    });

    connection.on('error', () => {
        alert("連線發生錯誤");
        onExit();
    });
  }, [connection, isHost, onExit]);


  // --- ACTIONS ---
  const sendScoreUpdate = (newScore: number) => {
      connection.send({ type: 'UPDATE_SCORE', score: newScore });
  };

  const handleAnswer = (option: string) => {
    if (isAnswered || phase !== 'fighting') return;
    
    setIsAnswered(true);
    setSelectedOption(option);

    const isCorrect = option === currentWord.chinese;
    
    // Scoring: Base 100 + Time Bonus (up to 50)
    // If wrong, 0 points
    let points = 0;
    if (isCorrect) {
        // roundTimer is roughly remaining time. 
        const bonus = Math.floor((roundTimer / ROUND_TIME) * 50);
        points = 100 + bonus;
    }

    if (points > 0) {
        const newScore = score + points;
        setScore(newScore);
        sendScoreUpdate(newScore);
    }
  };

  // --- RENDERERS ---

  if (phase === 'countdown') {
    return (
      <div className="fixed inset-0 bg-indigo-900 z-50 flex flex-col items-center justify-center text-white">
        <div className="text-2xl font-bold mb-4">準備開始</div>
        <div className="text-9xl font-black animate-bounce">{countdown === 0 ? 'GO!' : countdown}</div>
      </div>
    );
  }

  if (phase === 'finished') {
    const iWon = score > oppScore;
    const tie = score === oppScore;

    return (
      <div className="min-h-screen bg-indigo-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="text-6xl mb-4">{tie ? '🤝' : (iWon ? '🏆' : '💀')}</div>
        <h2 className="text-5xl font-black mb-2">{tie ? '平手!' : (iWon ? '你贏了!' : '你輸了!')}</h2>
        <p className="text-indigo-200 text-lg mb-8">{tie ? '勢均力敵！' : (iWon ? '太強了！' : '再接再厲！')}</p>

        <div className="flex gap-8 mb-10 w-full max-w-md">
            <div className={`flex-1 p-6 rounded-2xl ${iWon && !tie ? 'bg-yellow-500 text-yellow-900' : 'bg-white/10'}`}>
                <div className="text-xs uppercase opacity-70 mb-1">Me</div>
                <div className="text-4xl font-bold">{score}</div>
            </div>
            <div className={`flex-1 p-6 rounded-2xl ${!iWon && !tie ? 'bg-yellow-500 text-yellow-900' : 'bg-white/10'}`}>
                <div className="text-xs uppercase opacity-70 mb-1">Opponent</div>
                <div className="text-4xl font-bold">{oppScore}</div>
            </div>
        </div>

        <button 
            onClick={onExit}
            className="bg-white text-indigo-900 px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-100 transition-colors"
        >
            回到大廳
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen flex flex-col bg-gray-50">
      
      {/* HUD */}
      <div className="grid grid-cols-2 gap-4 mb-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                <span>YOU</span>
                <span>{score} pts</span>
            </div>
            <div className="text-2xl font-black text-indigo-600">{score}</div>
        </div>
        <div className="text-right">
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                <span>OPPONENT</span>
                <span>{oppScore} pts</span>
            </div>
            <div className="text-2xl font-black text-gray-400">{oppScore}</div>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="relative h-4 bg-gray-200 rounded-full mb-8 overflow-hidden">
          <div 
             className={`absolute top-0 left-0 h-full transition-all duration-100 linear ${roundTimer < 3 ? 'bg-red-500' : 'bg-yellow-400'}`}
             style={{ width: `${(roundTimer / ROUND_TIME) * 100}%` }}
          ></div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center items-center mb-8 relative">
         <span className="text-sm font-bold text-indigo-200 bg-indigo-900 px-3 py-1 rounded-full mb-4">
             Round {currentIndex + 1} / {words.length}
         </span>
         
         {/* Word Card */}
         <div className="w-full bg-white p-8 rounded-3xl shadow-lg text-center transform transition-all">
             <h1 className="text-4xl font-black text-gray-800 mb-2">{currentWord.word}</h1>
             <span className="text-gray-400 font-serif italic border border-gray-200 px-2 py-0.5 rounded">{currentWord.pos}</span>
         </div>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((option, idx) => {
            let btnClass = "w-full p-4 rounded-xl text-left font-bold transition-all border-2 shadow-sm relative overflow-hidden ";
            
            // Logic for revealing colors
            const isRevealing = phase === 'revealing' || phase === 'finished';
            const isCorrect = option === currentWord.chinese;
            
            if (isRevealing) {
                if (isCorrect) btnClass += "bg-green-500 border-green-500 text-white ";
                else if (selectedOption === option) btnClass += "bg-red-500 border-red-500 text-white ";
                else btnClass += "bg-gray-100 border-gray-100 text-gray-300 opacity-50 ";
            } else {
                if (selectedOption === option) btnClass += "bg-indigo-600 border-indigo-600 text-white ";
                else btnClass += "bg-white border-white hover:border-indigo-200 text-gray-700 ";
                
                if (isAnswered && selectedOption !== option) btnClass += "opacity-50 ";
            }

            return (
                <button
                    key={idx}
                    onClick={() => handleAnswer(option)}
                    disabled={isAnswered || phase !== 'fighting'}
                    className={btnClass}
                >
                    <div className="relative z-10 flex justify-between items-center">
                        {option}
                        {isRevealing && isCorrect && (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        )}
                        {isRevealing && !isCorrect && selectedOption === option && (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                    </div>
                </button>
            )
        })}
      </div>

      <div className="h-6 text-center text-sm font-bold text-gray-400">
          {phase === 'revealing' && "準備下一題..."}
          {phase === 'fighting' && isAnswered && "等待時間結束..."}
      </div>

    </div>
  );
};