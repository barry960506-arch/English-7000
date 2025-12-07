import React, { useState, useRef } from 'react';
import { saveCustomData, clearCustomData, parseWordData, hasCustomData } from '../services/dataProcessor';

// Declare XLSX globally since we loaded it via script tag
declare const XLSX: any;

interface Props {
  onBack: () => void;
  onDataUpdated: () => void;
}

export const DataImport: React.FC<Props> = ({ onBack, onDataUpdated }) => {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isUsingCustom = hasCustomData();

  const handleTextImport = () => {
    if (!text.trim()) {
      setStatus('error');
      setMessage('請輸入內容');
      return;
    }
    processImport(text);
  };

  const processImport = (rawData: string) => {
    try {
      const words = parseWordData(rawData);
      if (words.length === 0) {
        setStatus('error');
        setMessage('無法解析內容，請確認格式是否正確');
        return;
      }

      saveCustomData(rawData);
      setStatus('success');
      setMessage(`成功匯入 ${words.length} 個單字！`);
      setTimeout(() => {
        onDataUpdated();
        onBack();
      }, 1500);
    } catch (e) {
      setStatus('error');
      setMessage('發生錯誤，請稍後再試');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('idle');
    setMessage('正在讀取檔案...');

    const reader = new FileReader();
    
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Grab the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to array of arrays
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Convert Excel data to our text format string
        // Assuming columns: Level | Word | POS | Chinese (or similar variants)
        // We look for rows that have at least a number and some text
        
        let convertedText = "";
        let count = 0;

        jsonData.forEach(row => {
          if (!row || row.length < 2) return;

          // Try to map columns intelligently
          // Strategy: Find the first number (Level), first English word, first Chinese
          
          let level = "";
          let word = "";
          let pos = "n."; // default
          let chinese = "";

          // Simple heuristic: 
          // Col 0 is usually Level
          // Col 1 is usually Word
          // Col 2 is usually POS or Phonetic
          // Col 3+ is Chinese
          
          if (typeof row[0] === 'number' || (typeof row[0] === 'string' && /^\d+$/.test(row[0].trim()))) {
            level = row[0].toString().trim();
          }

          // If col 0 isn't level, maybe skip header row
          if (!level) return;

          // Find Word (usually 2nd column)
          if (row[1] && typeof row[1] === 'string') {
             word = row[1].trim();
          }

          // Find Chinese (look for unicode)
          for (let i = 2; i < row.length; i++) {
            const cell = row[i];
            if (typeof cell === 'string') {
                if (/[\u4e00-\u9fa5]/.test(cell)) {
                    chinese = cell.trim();
                } else if (cell.includes('.') && cell.length < 10) {
                    // Likely POS
                    pos = cell.trim();
                }
            }
          }

          if (level && word && chinese) {
            // Reconstruct into the text format our parser expects:
            // "1 ability n. 能力"
            convertedText += `${level} ${word} ${pos} ${chinese}\n`;
            count++;
          }
        });

        if (count > 0) {
            setText(convertedText); // Preview it
            processImport(convertedText);
        } else {
            setStatus('error');
            setMessage("無法從 Excel 辨識出單字。請確認 Excel 第一欄是 Level (數字)，第二欄是英文單字，並包含中文解釋。");
        }

      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage("檔案讀取失敗，請確認檔案格式是否為標準 Excel (.xlsx)");
      }
    };

    reader.readAsArrayBuffer(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    if (confirm('確定要清除自訂題庫並恢復預設嗎？')) {
        clearCustomData();
        onDataUpdated();
        onBack();
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 min-h-screen bg-white">
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack} 
          className="mr-4 p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">匯入單字題庫</h1>
      </div>

      <div className="space-y-6">
        {/* Excel Upload Section */}
        <div className="bg-green-50 p-5 rounded-2xl border border-green-100">
            <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-100 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="font-bold text-green-900">Excel 檔案匯入 (推薦)</h3>
            </div>
            <p className="text-sm text-green-800 mb-4 leading-relaxed">
                請從 Google Sheets 下載為 <strong>.xlsx</strong> 檔案後上傳。<br/>
                <span className="text-xs opacity-75">格式需求：第一欄 Level，第二欄單字，之後包含中文解釋。</span>
            </p>
            
            <input 
                type="file" 
                ref={fileInputRef}
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
            />
            <label 
                htmlFor="excel-upload"
                className="w-full bg-white text-green-700 border border-green-300 font-bold py-3 px-4 rounded-xl shadow-sm hover:bg-green-50 transition-colors cursor-pointer flex justify-center items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                點此上傳 Excel 檔
            </label>
        </div>

        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">或是</span>
            <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Text Paste Section */}
        <div>
            <h3 className="font-bold text-gray-700 mb-2">貼上文字內容</h3>
            <textarea
            className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm font-mono"
            placeholder="例如: 1 ability n. 能力..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            ></textarea>
        </div>

        {status === 'error' && (
          <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">{message}</p>
        )}
        
        {status === 'success' && (
          <p className="text-green-500 text-sm font-medium bg-green-50 p-3 rounded-lg border border-green-100">{message}</p>
        )}

        <button
          onClick={handleTextImport}
          className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
        >
          解析文字並匯入
        </button>

        {isUsingCustom && (
            <button
            onClick={handleReset}
            className="w-full bg-white text-red-500 font-bold py-3 rounded-xl border border-red-100 hover:bg-red-50 transition-colors mt-4"
            >
            清除自訂題庫 (恢復預設)
            </button>
        )}
      </div>
    </div>
  );
};