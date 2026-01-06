import { useGameStore } from '../store/gameStore';
import { AttributeBar } from './AttributeBar';
import { ENDING_TYPE_NAMES } from '../core/types';
import { gameEngine } from '../core/GameEngine';

export function EndingScreen() {
  const { gameState, currentEnding, restartGame } = useGameStore();

  if (!gameState || !currentEnding) {
    return (
      <div className="min-h-screen bg-hengdian-dark flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  const rating = gameEngine.getAttributeRating(gameState.attributes);

  const getEndingTypeColor = (type: string): string => {
    switch (type) {
      case 'upper':
        return 'from-yellow-600 to-yellow-400';
      case 'middle':
        return 'from-blue-600 to-blue-400';
      case 'lower':
        return 'from-gray-600 to-gray-400';
      default:
        return 'from-gray-600 to-gray-400';
    }
  };

  const handleShare = () => {
    const shareText = `我在《重生之我在横店当群演》中获得了【${currentEnding.name}】结局！
评分：${rating.rating}
${currentEnding.icon} ${currentEnding.title}

你也来试试吧！`;

    if (navigator.share) {
      navigator.share({
        title: '重生之我在横店当群演',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('已复制到剪贴板！');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-hengdian-dark to-gray-900 p-4">
      {/* 结局类型标签 */}
      <div className="text-center pt-6 pb-4">
        <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${getEndingTypeColor(currentEnding.type)} text-white`}>
          {ENDING_TYPE_NAMES[currentEnding.type]}
        </span>
      </div>

      {/* 结局图标和标题 */}
      <div className="text-center mb-6">
        <div className="text-7xl mb-4">{currentEnding.icon}</div>
        <h1 className="text-3xl font-bold text-hengdian-gold mb-2">
          {currentEnding.name}
        </h1>
        <p className="text-xl text-gray-300">{currentEnding.title}</p>
      </div>

      {/* 评分 */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-800 rounded-xl px-6 py-4 text-center">
          <div className="text-5xl font-bold text-hengdian-gold mb-1">
            {rating.rating}
          </div>
          <div className="text-gray-400 text-sm">
            总属性 {rating.total} | 平均 {rating.average.toFixed(1)}
          </div>
        </div>
      </div>

      {/* 最终属性 */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 max-w-md mx-auto">
        <h3 className="text-gray-400 text-sm mb-3 text-center">最终属性</h3>
        <AttributeBar attributes={gameState.attributes} />
      </div>

      {/* 结局描述 */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 max-w-md mx-auto">
        <p className="text-gray-200 leading-relaxed">
          {currentEnding.description}
        </p>
      </div>

      {/* 结局故事 */}
      <div className="bg-gray-800/50 rounded-xl p-4 mb-8 max-w-md mx-auto">
        <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm">
          {currentEnding.epilogue}
        </p>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">
            {gameState.eventHistory.length}
          </div>
          <div className="text-gray-400 text-sm">经历事件</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">
            {Object.keys(gameState.flags).length}
          </div>
          <div className="text-gray-400 text-sm">触发标记</div>
        </div>
      </div>

      {/* 按钮组 */}
      <div className="flex flex-col gap-3 max-w-md mx-auto pb-8">
        <button
          onClick={handleShare}
          className="w-full py-4 bg-hengdian-gold hover:bg-yellow-600 text-hengdian-dark font-bold rounded-lg text-lg transition-colors"
        >
          📤 分享结果
        </button>
        <button
          onClick={restartGame}
          className="w-full py-4 bg-hengdian-red hover:bg-red-700 text-white font-bold rounded-lg text-lg transition-colors"
        >
          🔄 重新开始
        </button>
      </div>
    </div>
  );
}
