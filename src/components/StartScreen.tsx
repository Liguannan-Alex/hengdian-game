import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { StatsPanel } from './StatsPanel';

export function StartScreen() {
  const { startNewGame, continueGame, hasSavedGame } = useGameStore();
  const hasSave = hasSavedGame();
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-hengdian-dark to-gray-900 flex flex-col items-center justify-center p-4">
      {/* 标题 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-hengdian-gold mb-4 font-game">
          重生之我在横店当群演
        </h1>
        <p className="text-gray-400 text-lg">
          体验横店群演的酸甜苦辣
        </p>
      </div>

      {/* 装饰图案 */}
      <div className="text-6xl mb-12">🎬</div>

      {/* 按钮组 */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={startNewGame}
          className="w-full py-4 px-8 bg-hengdian-red hover:bg-red-700 text-white font-bold rounded-lg text-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          开始新游戏
        </button>

        {hasSave && (
          <button
            onClick={continueGame}
            className="w-full py-4 px-8 bg-hengdian-gold hover:bg-yellow-600 text-hengdian-dark font-bold rounded-lg text-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            继续游戏
          </button>
        )}

        <button
          onClick={() => setShowStats(true)}
          className="w-full py-3 px-8 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg text-lg transition-all duration-200"
        >
          📊 数据统计
        </button>
      </div>

      {/* 统计面板 */}
      {showStats && <StatsPanel onClose={() => setShowStats(false)} />}

      {/* 底部信息 */}
      <div className="absolute bottom-8 text-center text-gray-500 text-sm">
        <p>一款文字选择类游戏</p>
        <p className="mt-1">类似《人生重开模拟器》</p>
      </div>
    </div>
  );
}
