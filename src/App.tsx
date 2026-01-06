import { useGameStore } from './store/gameStore';
import { StartScreen } from './components/StartScreen';
import { TalentSelect } from './components/TalentSelect';
import { AttributeSet } from './components/AttributeSet';
import { GameScreen } from './components/GameScreen';
import { EndingScreen } from './components/EndingScreen';
import { WeChatGuide, isWeChatBrowser } from './components/WeChatGuide';

function App() {
  const { gameState } = useGameStore();

  // 检测微信浏览器
  if (isWeChatBrowser()) {
    return <WeChatGuide url={window.location.href} />;
  }

  // 根据游戏阶段渲染不同的界面
  const renderScreen = () => {
    if (!gameState) {
      return <StartScreen />;
    }

    switch (gameState.phase) {
      case 'start':
        return <StartScreen />;
      case 'talents':
        return <TalentSelect />;
      case 'attributes':
        return <AttributeSet />;
      case 'playing':
        return <GameScreen />;
      case 'ending':
        return <EndingScreen />;
      default:
        return <StartScreen />;
    }
  };

  return (
    <div className="font-game">
      {renderScreen()}
    </div>
  );
}

export default App;
