import { WordItem, StorageKeys } from '../types';

// Default small dataset for initial load or fallback
const DEFAULT_RAW_DATA = `
1 ability n. ability (n.) 能力
1 able adj. able (adj.) 有能力的
1 about prep./adv. about (prep./adv.) 關於
1 above prep./adv./adj. above (prep./adv./adj.) 多於
1 abroad adv. abroad (adv.) 國外
1 across prep./adv. across (prep./adv.) 穿過
1 act n./v. act (n./v.) 行為
1 action n. action (n.) 行動
1 actor/actress n. actor/actress (n.) 男演員/女演員
1 add v. add (v.) 添加
1 afraid adj. afraid (adj.) 害怕的
1 after prep./conj./adv. after (prep./conj./adv.) 後
1 afternoon n. afternoon (n.) 午安
1 again adv. again (adv.) 再次
1 age n./v. age (n./v.) 年齡
1 ago adv. ago (adv.) 前
1 agree v. agree (v.) 同意
1 air n. air (n.) 空氣
1 airplane/plane n. airplane/plane (n.) 飛機/飛機
1 airport n. airport (n.) 飛機場
1 all adj./adv./pron./n. all (adj./adv./pron./n.) 全部
1 allow v. allow (v.) 允許
1 almost adv. almost (adv.) 幾乎
1 along prep./adv. along (prep./adv.) 沿著
1 already adv. already (adv.) 已經
1 also adv. also (adv.) 也
1 although conj. although (conj.) 雖然
1 always adv. always (adv.) 總是
2 absence n. absence (n.) 缺席
2 absent adj./v. absent (adj./v.) 缺席的
2 accept v. accept (v.) 接受
2 accident n. accident (n.) 意外事故
2 account n./v. account (n./v.) 帳戶
2 active adj. active (adj.) 積極的
2 activity n. activity (n.) 活動
2 actual adj. actual (adj.) 實際的
2 addition n. addition (n.) 添加
2 address v./n. address (v./n.) 地址
2 admit v. admit (v.) 承認
2 adult n./adj. adult (n./adj.) 成人
2 advance n./v. advance (n./v.) 進步
2 advice n. advice (n.) 建議
2 affair n. affair (n.) 事務
2 affect v. affect (v.) 影響
3 afterward/afterwards adv. afterward/afterwards (adv.) 之後/之後
3 agriculture n. agriculture (n.) 農業
3 airline n. airline (n.) 航空
3 alley n. alley (n.) 胡同
3 almond n. almond (n.) 杏仁
3 alphabet n. alphabet (n.) 字母
3 amaze(ment) v./(n.) amaze(ment) (v./(n.)) 驚愕）
3 ambassador n. ambassador (n.) 大使
3 ambition n. ambition (n.) 志向
3 ambulance n. ambulance (n.) 救護車
3 angel n. angel (n.) 天使
3 announce(ment) v./(n.) announce(ment) (v./(n.)) 公告）
3 anxious adj. anxious (adj.) 焦慮的
3 anyhow adv. anyhow (adv.) 無論如何
3 apart adv. apart (adv.) 分開
4 equip(ment) v./(n.) equip(ment) (v./(n.)) 裝置）
4 era n. era (n.) 時代
4 essential adj./n. essential (adj./n.) 基本的
4 establish(ment) v./(n.) establish(ment) (v./(n.)) 設立（設立）
4 estimate n./v. estimate (n./v.) 估計
4 ethnic adj./n. ethnic (adj./n.) 種族的
4 evaluate v. evaluate (v.) 評價
4 evaluation n. evaluation (n.) 評估
4 eventual adj. eventual (adj.) 最終的
4 evidence n./v. evidence (n./v.) 證據
4 evident adj. evident (adj.) 明顯
4 exaggerate v. exaggerate (v.) 誇大
4 exception n. exception (n.) 例外
4 exhaust n./v. exhaust (n./v.) 排氣
5 deliberate adj./v. deliberate (adj./v.) 商榷
5 democrat n. democrat (n.) 民主黨
5 denial n. denial (n.) 拒絕
5 density n. density (n.) 密度
5 depict v. depict (v.) 描繪
5 deploy v. deploy (v.) 部署
5 depress v. depress (v.) 壓抑
5 deputy n. deputy (n.) 副
5 derive v. derive (v.) 衍生
5 descend v. descend (v.) 下降
5 descriptive adj. descriptive (adj.) 描述性的
5 despair n./v. despair (n./v.) 絕望
5 destination n. destination (n.) 目的地
5 destiny n. destiny (n.) 命運
6 abbreviate v. abbreviate (v.) 縮寫
6 abide v. abide (v.) 遵守
6 aboriginal adj./n. aboriginal (adj./n.) 原住民
6 abound v. abound (v.) 盛產
6 abstraction n. abstraction (n.) 抽象
6 abundance n. abundance (n.) 豐富
6 academy n. academy (n.) 學院
6 accessory n./adj. accessory (n./adj.) 配件
6 acclaim n./v. acclaim (n./v.) 歡呼
6 accordance n. accordance (n.) 符合
6 accordingly adv. accordingly (adv.) 因此
6 accountable adj. accountable (adj.) 負責任的
6 accumulate v. accumulate (v.) 累積
`;

export const parseWordData = (rawData: string): WordItem[] => {
  const lines = rawData.trim().split('\n');
  const words: WordItem[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    // Skip headers or weird lines
    if (trimmed.startsWith('級別') || trimmed.includes('Screenshot')) return;

    try {
        const parts = trimmed.split(/\s+/);
        const level = parseInt(parts[0]);
        
        if (isNaN(level)) return; // Skip invalid lines

        // Heuristic to find Chinese part
        let chineseStartIndex = -1;
        for (let i = 0; i < parts.length; i++) {
            if (/[\u4e00-\u9fa5]/.test(parts[i])) {
                chineseStartIndex = i;
                break;
            }
        }

        if (chineseStartIndex === -1) {
            chineseStartIndex = parts.length - 1;
        }

        const chinese = parts.slice(chineseStartIndex).join(' ');
        const word = parts[1];
        const pos = parts[2];

        // Only add if we have valid data
        if (word && chinese) {
            words.push({
                id: `word-${index}-${word}`, // Unique ID based on index and word content
                level,
                word,
                pos: pos || 'n.',
                chinese
            });
        }
    } catch (e) {
        // console.warn("Failed to parse line:", line);
    }
  });

  return words;
};

// Helper to get distractors (wrong answers)
export const getDistractors = (correctWord: WordItem, allWords: WordItem[], count: number = 3): string[] => {
  const distractors: string[] = [];
  // Filter out the correct word
  const pool = allWords.filter(w => w.chinese !== correctWord.chinese);
  
  // Create a copy of pool indices to pick from
  const indices = Array.from({ length: pool.length }, (_, i) => i);
  
  // Shuffle indices
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  for (const index of indices) {
    if (distractors.length >= count) break;
    const word = pool[index];
    if (!distractors.includes(word.chinese)) {
      distractors.push(word.chinese);
    }
  }

  // Fallback if not enough words (e.g. initial small dataset)
  while (distractors.length < count) {
      distractors.push("未知選項");
  }
  
  return distractors;
};

export const saveCustomData = (text: string) => {
    localStorage.setItem(StorageKeys.CUSTOM_DATA, text);
};

export const clearCustomData = () => {
    localStorage.removeItem(StorageKeys.CUSTOM_DATA);
};

export const hasCustomData = (): boolean => {
    return !!localStorage.getItem(StorageKeys.CUSTOM_DATA);
};

export const getAllWords = (): WordItem[] => {
    const customData = localStorage.getItem(StorageKeys.CUSTOM_DATA);
    if (customData) {
        const parsed = parseWordData(customData);
        if (parsed.length > 0) return parsed;
    }
    return parseWordData(DEFAULT_RAW_DATA);
};