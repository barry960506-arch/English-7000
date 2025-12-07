import React, { useState, useEffect, useRef } from 'react';
import { WordItem } from '../types';

declare const Peer: any;

interface Props {
  allWords: WordItem[];
  onBack: () => void;
  onGameStart: (connection: any, isHost: boolean, words: WordItem[]) => void;
}

export const PKLobby: React.FC<Props> = ({ allWords, onBack, onGameStart }) => {
  const [mode, setMode] = useState<'menu' | 'host' | 'join'>('menu');
  const [displayId, setDisplayId] = useState<string>('');
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState('');
  const [settings, setSettings] = useState({ level: 1, count: 10 });
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);

  // Get available levels
  const levels = Array.from(new Set(allWords.map(w => w.level))).sort((a, b) => Number(a) - Number(b));

  useEffect(() => {
    // Clean up peer on unmount
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  const generateShortId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const initPeer = (customId?: string) => {
    setStatus('正在連線到對戰伺服器...');
    
    // We use a prefix to avoid collisions with other PeerJS users
    const fullId = customId ? `vocab-master-${customId}` : undefined;
    
    const peer = new Peer(fullId, {
      debug: 1
    });

    peer.on('open', (id: string) => {
      // Extract the number part for display
      const shortId = id.replace('vocab-master-', '');
      setDisplayId(shortId);
      setStatus(customId ? '等待對手加入...' : '已連線');
    });

    peer.on('error', (err: any) => {
      console.error(err);
      if (err.type === 'unavailable-id') {
          // Retry with new ID if collision
          initPeer(generateShortId());
      } else {
          setStatus('連線錯誤: ' + err.type);
      }
    });

    peerRef.current = peer;
    return peer;
  };

  const handleCreateRoom = () => {
    setMode('host');
    const shortId = generateShortId();
    const peer = initPeer(shortId);

    peer.on('connection', (conn: any) => {
      connRef.current = conn;
      setStatus('對手已連線！準備開始...');
    });
  };

  const handleJoinRoom = () => {
    setMode('join');
    // Init peer with random ID for the joiner
    const peer = initPeer();
  };

  const connectToHost = () => {
    if (!joinCode || joinCode.length !== 6) {
        setStatus('請輸入6位數代碼');
        return;
    }
    
    setStatus('正在連線給房主...');
    const fullHostId = `vocab-master-${joinCode}`;
    const conn = peerRef.current.connect(fullHostId);
    
    conn.on('open', () => {
      setStatus('已連線！等待房主開始遊戲...');
      connRef.current = conn;
    });

    conn.on('data', (data: any) => {
      if (data.type === 'START_GAME') {
        // Game started by host
        onGameStart(conn, false, data.words);
      }
    });

    conn.on('error', (err: any) => {
      setStatus('連線失敗，請檢查代碼');
    });
  };

  const startGameAsHost = () => {
    if (!connRef.current) return;
    
    // Generate words
    const levelWords = allWords.filter(w => w.level === settings.level);
    const shuffled = [...levelWords].sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, settings.count);

    if (selectedWords.length === 0) {
        alert("該等級沒有足夠的單字！");
        return;
    }

    // Send start signal and data to peer
    connRef.current.send({
      type: 'START_GAME',
      words: selectedWords
    });

    // Start local
    onGameStart(connRef.current, true, selectedWords);
  };

  const copyId = () => {
    navigator.clipboard.writeText(displayId);
    alert('已複製房間代碼！');
  };

  return (
    <div className="max-w-md mx-auto p-6 min-h-screen bg-indigo-50 flex flex-col">
      <div className="flex items-center mb-8">
        <button 
          onClick={onBack} 
          className="mr-4 p-2 -ml-2 rounded-full hover:bg-white/50 text-indigo-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-2xl font-black text-indigo-900 tracking-tight">線上對戰大廳</h1>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        
        {mode === 'menu' && (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={handleCreateRoom}
              className="w-full bg-indigo-600 text-white p-6 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all transform hover:-translate-y-1"
            >
              <div className="text-xl font-bold mb-1">👑 建立房間</div>
              <div className="text-indigo-200 text-sm">我是房主，設定規則</div>
            </button>

            <button
              onClick={handleJoinRoom}
              className="w-full bg-white text-indigo-600 p-6 rounded-2xl shadow-xl border-2 border-indigo-100 hover:border-indigo-300 transition-all transform hover:-translate-y-1"
            >
              <div className="text-xl font-bold mb-1">🚀 加入房間</div>
              <div className="text-gray-400 text-sm">輸入朋友的代碼</div>
            </button>
          </div>
        )}

        {mode === 'host' && (
          <div className="bg-white p-6 rounded-3xl shadow-xl space-y-6 animate-fade-in">
            <div className="text-center border-b border-gray-100 pb-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Room Code</span>
              <div 
                onClick={copyId}
                className="text-4xl font-mono font-black text-indigo-600 mt-2 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors flex items-center justify-center gap-2"
                title="點擊複製"
              >
                {displayId || 'Generating...'}
              </div>
              <p className="text-xs text-gray-400 mt-2">請對手輸入此 6 位數代碼</p>
            </div>

            {/* Settings */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">難度 (Level)</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {levels.map(l => (
                            <button 
                                key={l}
                                onClick={() => setSettings(s => ({...s, level: l}))}
                                className={`flex-shrink-0 w-10 h-10 rounded-full font-bold transition-all ${settings.level === l ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-gray-100 text-gray-400'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">題數</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[10, 20, 30].map(c => (
                            <button 
                                key={c}
                                onClick={() => setSettings(s => ({...s, count: c}))}
                                className={`py-2 rounded-xl font-bold text-sm transition-all ${settings.count === c ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-400'}`}
                            >
                                {c} 題
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
                <p className={`text-center font-medium mb-4 ${connRef.current ? 'text-green-500 animate-pulse' : 'text-gray-400'}`}>
                    {status}
                </p>
                <button
                    onClick={startGameAsHost}
                    disabled={!connRef.current}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                        connRef.current 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-600 text-white transform hover:scale-105' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    開始對戰！
                </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
           <div className="bg-white p-6 rounded-3xl shadow-xl space-y-6 animate-fade-in">
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">輸入 6 位數房間代碼</label>
                <input 
                    type="number"
                    pattern="\d*"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.trim().slice(0, 6))}
                    placeholder="e.g. 123456"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-center font-mono text-2xl tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
                />
             </div>

             <div className="text-center text-sm font-medium text-indigo-500 min-h-[1.5em]">
                 {status}
             </div>

             <button
                onClick={connectToHost}
                disabled={joinCode.length !== 6 || !!connRef.current}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
             >
                 連線加入
             </button>
           </div> 
        )}

      </div>
    </div>
  );
};