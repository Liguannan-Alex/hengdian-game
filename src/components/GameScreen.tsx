import { useGameStore } from '../store/gameStore';
import { AttributeBar } from './AttributeBar';
import { EventCard } from './EventCard';
import { STAGE_NAMES, STAGE_ORDER } from '../core/types';

export function GameScreen() {
  const {
    gameState,
    visibleChoices,
    makeChoice,
    showHiddenEffect,
    lastHiddenMessage,
    saveGame
  } = useGameStore();

  if (!gameState || !gameState.currentEvent) {
    return (
      <div className="min-h-screen bg-hengdian-dark flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  const currentStageIndex = STAGE_ORDER.indexOf(gameState.currentStage);

  const handleChoice = (choiceId: string) => {
    makeChoice(choiceId);
    // 自动保存
    setTimeout(() => saveGame(), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-hengdian-dark to-gray-900">
      {/* 顶部状态栏 */}
      <div className="sticky top-0 z-10 bg-hengdian-dark/95 backdrop-blur-sm border-b border-gray-800">
        {/* 阶段进度 */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-hengdian-gold font-bold">
              {STAGE_NAMES[gameState.currentStage]}
            </span>
            <span className="text-gray-400 text-sm">
              第 {currentStageIndex + 1}/{STAGE_ORDER.length} 阶段
            </span>
          </div>

          {/* 阶段进度条 */}
          <div className="flex gap-1">
            {STAGE_ORDER.map((stage, index) => (
              <div
                key={stage}
                className={`flex-1 h-1 rounded-full ${
                  index < currentStageIndex
                    ? 'bg-hengdian-gold'
                    : index === currentStageIndex
                      ? 'bg-hengdian-red'
                      : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 属性条 */}
        <div className="px-4 pb-3">
          <AttributeBar attributes={gameState.attributes} compact />
        </div>
      </div>

      {/* 隐藏效果提示 */}
      {showHiddenEffect && lastHiddenMessage && (
        <div className="mx-4 mt-4 p-3 bg-green-900/50 border border-green-500 rounded-lg">
          <p className="text-green-400 text-center">
            ✨ {lastHiddenMessage}
          </p>
        </div>
      )}

      {/* 事件卡片 */}
      <div className="p-4">
        <EventCard
          event={gameState.currentEvent}
          choices={visibleChoices}
          onChoose={handleChoice}
        />
      </div>

      {/* 事件计数 */}
      <div className="text-center text-gray-500 text-sm pb-8">
        已经历 {gameState.eventHistory.length} 个事件
      </div>
    </div>
  );
}
