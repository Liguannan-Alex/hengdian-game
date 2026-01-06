import { create } from 'zustand';
import {
  GameState,
  GamePhase,
  Attributes,
  Talent,
  Choice,
  Ending
} from '../core/types';
import { gameEngine } from '../core/GameEngine';

interface GameStore {
  // 游戏状态
  gameState: GameState | null;

  // UI 状态
  availableTalents: Talent[];
  visibleChoices: Choice[];
  currentEnding: Ending | null;
  isLoading: boolean;
  showHiddenEffect: boolean;
  lastHiddenMessage: string | null;

  // 动作
  startNewGame: () => void;
  continueGame: () => void;
  selectTalents: (talentIds: string[]) => void;
  distributeAttributes: (attributes: Attributes) => void;
  proceedToNextEvent: () => void;
  makeChoice: (choiceId: string) => void;
  restartGame: () => void;
  saveGame: () => void;

  // 辅助
  hasSavedGame: () => boolean;
  getPhase: () => GamePhase | null;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // 初始状态
  gameState: null,
  availableTalents: [],
  visibleChoices: [],
  currentEnding: null,
  isLoading: false,
  showHiddenEffect: false,
  lastHiddenMessage: null,

  // 开始新游戏
  startNewGame: () => {
    const newState = gameEngine.createNewGame();
    const talents = gameEngine.getRandomTalentsForSelection();

    set({
      gameState: { ...newState, phase: 'talents' },
      availableTalents: talents,
      visibleChoices: [],
      currentEnding: null,
      showHiddenEffect: false,
      lastHiddenMessage: null
    });
  },

  // 继续游戏
  continueGame: () => {
    const savedState = gameEngine.loadGame();
    if (savedState) {
      set({
        gameState: savedState,
        currentEnding: savedState.ending
          ? gameEngine.getEnding(savedState.ending) || null
          : null
      });

      // 如果在游戏中，获取当前事件的选择
      if (savedState.phase === 'playing' && savedState.currentEvent) {
        const choices = gameEngine.getVisibleChoices(savedState);
        set({ visibleChoices: choices });
      }
    }
  },

  // 选择天赋
  selectTalents: (talentIds: string[]) => {
    const { gameState } = get();
    if (!gameState) return;

    try {
      const newState = gameEngine.selectTalents(gameState, talentIds);
      set({
        gameState: newState,
        availableTalents: []
      });
    } catch (error) {
      console.error('天赋选择失败:', error);
    }
  },

  // 分配属性
  distributeAttributes: (attributes: Attributes) => {
    const { gameState } = get();
    if (!gameState) return;

    try {
      const newState = gameEngine.distributeAttributes(gameState, attributes);

      // 获取第一个事件
      const firstEvent = gameEngine.getNextEvent(newState);
      if (firstEvent) {
        const stateWithEvent = gameEngine.startEvent(newState, firstEvent);
        const choices = gameEngine.getVisibleChoices(stateWithEvent);

        set({
          gameState: stateWithEvent,
          visibleChoices: choices
        });
      } else {
        set({ gameState: newState });
      }
    } catch (error) {
      console.error('属性分配失败:', error);
    }
  },

  // 进入下一个事件
  proceedToNextEvent: () => {
    const { gameState } = get();
    if (!gameState || gameState.phase !== 'playing') return;

    const nextEvent = gameEngine.getNextEvent(gameState);
    if (nextEvent) {
      const newState = gameEngine.startEvent(gameState, nextEvent);
      const choices = gameEngine.getVisibleChoices(newState);

      set({
        gameState: newState,
        visibleChoices: choices,
        showHiddenEffect: false,
        lastHiddenMessage: null
      });
    } else {
      // 没有更多事件，计算结局
      const finalState = gameEngine.calculateEnding(gameState);
      const ending = gameEngine.getEnding(finalState.ending || '');

      set({
        gameState: finalState,
        currentEnding: ending || null
      });
    }
  },

  // 做出选择
  makeChoice: (choiceId: string) => {
    const { gameState } = get();
    if (!gameState || !gameState.currentEvent) return;

    try {
      const newState = gameEngine.makeChoice(gameState, choiceId);

      // 检查是否触发了隐藏效果
      const latestHistory = newState.eventHistory[newState.eventHistory.length - 1];
      let hiddenMessage: string | null = null;

      if (latestHistory?.hiddenTriggered) {
        // 生成隐藏效果提示信息
        const choice = gameState.currentEvent.choices.find(c => c.id === choiceId);
        if (choice?.hiddenConsequences) {
          const effects: string[] = [];
          if (choice.hiddenConsequences.attributeChanges) {
            for (const [key, value] of Object.entries(choice.hiddenConsequences.attributeChanges)) {
              if (value && value > 0) {
                effects.push(`${key} +${value}`);
              }
            }
          }
          if (effects.length > 0) {
            hiddenMessage = `运气不错！${effects.join(', ')}`;
          }
        }
      }

      // 如果进入结局阶段
      if (newState.phase === 'ending') {
        const ending = gameEngine.getEnding(newState.ending || '');
        set({
          gameState: newState,
          currentEnding: ending || null,
          visibleChoices: [],
          showHiddenEffect: !!hiddenMessage,
          lastHiddenMessage: hiddenMessage
        });
        return;
      }

      // 获取下一个事件
      const nextEvent = gameEngine.getNextEvent(newState);
      if (nextEvent) {
        const stateWithEvent = gameEngine.startEvent(newState, nextEvent);
        const choices = gameEngine.getVisibleChoices(stateWithEvent);

        set({
          gameState: stateWithEvent,
          visibleChoices: choices,
          showHiddenEffect: !!hiddenMessage,
          lastHiddenMessage: hiddenMessage
        });
      } else {
        // 没有更多事件，计算结局
        const finalState = gameEngine.calculateEnding(newState);
        const ending = gameEngine.getEnding(finalState.ending || '');

        set({
          gameState: finalState,
          currentEnding: ending || null,
          visibleChoices: [],
          showHiddenEffect: !!hiddenMessage,
          lastHiddenMessage: hiddenMessage
        });
      }
    } catch (error) {
      console.error('选择失败:', error);
    }
  },

  // 重新开始
  restartGame: () => {
    gameEngine.deleteSave();
    set({
      gameState: null,
      availableTalents: [],
      visibleChoices: [],
      currentEnding: null,
      showHiddenEffect: false,
      lastHiddenMessage: null
    });
  },

  // 保存游戏
  saveGame: () => {
    const { gameState } = get();
    if (gameState) {
      gameEngine.saveGame(gameState);
    }
  },

  // 检查是否有存档
  hasSavedGame: () => {
    return gameEngine.hasSave();
  },

  // 获取当前阶段
  getPhase: () => {
    const { gameState } = get();
    return gameState?.phase || null;
  }
}));
