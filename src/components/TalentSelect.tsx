import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Talent } from '../core/types';

export function TalentSelect() {
  const { availableTalents, selectTalents } = useGameStore();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleTalent = (talentId: string) => {
    if (selected.includes(talentId)) {
      setSelected(selected.filter(id => id !== talentId));
    } else if (selected.length < 3) {
      setSelected([...selected, talentId]);
    }
  };

  const handleConfirm = () => {
    if (selected.length === 3) {
      selectTalents(selected);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-hengdian-dark to-gray-900 p-4">
      {/* 标题 */}
      <div className="text-center py-6">
        <h2 className="text-2xl font-bold text-hengdian-gold mb-2">选择天赋</h2>
        <p className="text-gray-400">
          选择 3 个天赋开始你的群演生涯
          <span className="ml-2 text-hengdian-gold">({selected.length}/3)</span>
        </p>
      </div>

      {/* 天赋列表 */}
      <div className="grid gap-3 max-w-lg mx-auto pb-24">
        {availableTalents.map((talent: Talent) => {
          const isSelected = selected.includes(talent.id);
          const isDisabled = !isSelected && selected.length >= 3;

          return (
            <button
              key={talent.id}
              onClick={() => toggleTalent(talent.id)}
              disabled={isDisabled}
              className={`
                p-4 rounded-lg text-left transition-all duration-200
                ${isSelected
                  ? 'bg-hengdian-gold text-hengdian-dark ring-2 ring-white'
                  : isDisabled
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">
                  {isSelected ? '✓' : '○'}
                </span>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{talent.name}</h3>
                  <p className={`text-sm mt-1 ${isSelected ? 'text-hengdian-dark/80' : 'text-gray-400'}`}>
                    {talent.description}
                  </p>
                  {talent.effects.attributeBonuses && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(talent.effects.attributeBonuses).map(([key, value]) => (
                        <span
                          key={key}
                          className={`text-xs px-2 py-1 rounded ${
                            isSelected
                              ? 'bg-hengdian-dark/20 text-hengdian-dark'
                              : 'bg-green-900/50 text-green-400'
                          }`}
                        >
                          {getAttributeName(key)} +{value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 确认按钮 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-hengdian-dark to-transparent">
        <button
          onClick={handleConfirm}
          disabled={selected.length !== 3}
          className={`
            w-full max-w-lg mx-auto block py-4 rounded-lg font-bold text-xl
            transition-all duration-200
            ${selected.length === 3
              ? 'bg-hengdian-red text-white hover:bg-red-700'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {selected.length === 3 ? '确认选择' : `还需选择 ${3 - selected.length} 个天赋`}
        </button>
      </div>
    </div>
  );
}

// 属性名称映射
function getAttributeName(key: string): string {
  const names: Record<string, string> = {
    appearance: '颜值',
    acting: '演技',
    connections: '人脉',
    savings: '存款',
    resilience: '韧劲'
  };
  return names[key] || key;
}
