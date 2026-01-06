import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Attributes, ATTRIBUTE_NAMES, ATTRIBUTE_DESCRIPTIONS, DEFAULT_GAME_CONFIG } from '../core/types';
import { talentManager } from '../core/TalentManager';

export function AttributeSet() {
  const { gameState, distributeAttributes } = useGameStore();

  // 计算天赋加成
  const bonusPoints = gameState?.selectedTalents
    ? talentManager.calculateBonusPoints(gameState.selectedTalents)
    : 0;

  const totalPoints = DEFAULT_GAME_CONFIG.initialAttributePoints + bonusPoints;

  const [attributes, setAttributes] = useState<Attributes>({
    appearance: 4,
    acting: 4,
    connections: 4,
    savings: 4,
    resilience: 4
  });

  const usedPoints = Object.values(attributes).reduce((sum, val) => sum + val, 0);
  const remainingPoints = totalPoints - usedPoints;

  const handleChange = (key: keyof Attributes, delta: number) => {
    const newValue = attributes[key] + delta;

    // 检查边界
    if (newValue < DEFAULT_GAME_CONFIG.minAttributeValue) return;
    if (newValue > DEFAULT_GAME_CONFIG.maxAttributeValue) return;

    // 检查剩余点数
    if (delta > 0 && remainingPoints <= 0) return;

    setAttributes({
      ...attributes,
      [key]: newValue
    });
  };

  const handleConfirm = () => {
    if (remainingPoints === 0) {
      distributeAttributes(attributes);
    }
  };

  const handleRandomize = () => {
    // 随机分配属性点
    const keys: (keyof Attributes)[] = ['appearance', 'acting', 'connections', 'savings', 'resilience'];
    const newAttributes: Attributes = {
      appearance: 1,
      acting: 1,
      connections: 1,
      savings: 1,
      resilience: 1
    };

    let remaining = totalPoints - 5; // 每个属性至少1点

    while (remaining > 0) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      if (newAttributes[randomKey] < DEFAULT_GAME_CONFIG.maxAttributeValue) {
        newAttributes[randomKey]++;
        remaining--;
      }
    }

    setAttributes(newAttributes);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-hengdian-dark to-gray-900 p-4">
      {/* 标题 */}
      <div className="text-center py-6">
        <h2 className="text-2xl font-bold text-hengdian-gold mb-2">分配属性</h2>
        <p className="text-gray-400">
          剩余点数：
          <span className={`ml-2 font-bold ${remainingPoints === 0 ? 'text-green-400' : 'text-hengdian-gold'}`}>
            {remainingPoints}
          </span>
        </p>
        {bonusPoints > 0 && (
          <p className="text-green-400 text-sm mt-1">
            天赋加成 +{bonusPoints} 点
          </p>
        )}
      </div>

      {/* 属性列表 */}
      <div className="max-w-lg mx-auto space-y-4 pb-32">
        {(Object.keys(attributes) as Array<keyof Attributes>).map(key => (
          <div key={key} className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold text-white">{ATTRIBUTE_NAMES[key]}</h3>
                <p className="text-xs text-gray-400">{ATTRIBUTE_DESCRIPTIONS[key]}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleChange(key, -1)}
                  disabled={attributes[key] <= DEFAULT_GAME_CONFIG.minAttributeValue}
                  className="w-10 h-10 rounded-full bg-gray-700 text-white font-bold text-xl hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  -
                </button>
                <span className="w-8 text-center text-2xl font-bold text-hengdian-gold">
                  {attributes[key]}
                </span>
                <button
                  onClick={() => handleChange(key, 1)}
                  disabled={attributes[key] >= DEFAULT_GAME_CONFIG.maxAttributeValue || remainingPoints <= 0}
                  className="w-10 h-10 rounded-full bg-gray-700 text-white font-bold text-xl hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* 进度条 */}
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-hengdian-gold to-yellow-400 transition-all duration-200"
                style={{ width: `${(attributes[key] / DEFAULT_GAME_CONFIG.maxAttributeValue) * 100}%` }}
              />
            </div>
          </div>
        ))}

        {/* 随机分配按钮 */}
        <button
          onClick={handleRandomize}
          className="w-full py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
        >
          🎲 随机分配
        </button>
      </div>

      {/* 确认按钮 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-hengdian-dark to-transparent">
        <button
          onClick={handleConfirm}
          disabled={remainingPoints !== 0}
          className={`
            w-full max-w-lg mx-auto block py-4 rounded-lg font-bold text-xl
            transition-all duration-200
            ${remainingPoints === 0
              ? 'bg-hengdian-red text-white hover:bg-red-700'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {remainingPoints === 0 ? '开始闯横店！' : `还有 ${remainingPoints} 点未分配`}
        </button>
      </div>
    </div>
  );
}
