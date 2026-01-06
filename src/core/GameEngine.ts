import {
  GameState,
  Attributes,
  Choice,
  GameEvent,
  Ending,
  EventHistoryEntry,
  INITIAL_ATTRIBUTES,
  STAGE_ORDER
} from './types';
import { ProbabilityCalculator } from './ProbabilitySystem';
import { attributeSystem } from './AttributeSystem';
import { talentManager } from './TalentManager';
import { eventEngine } from './EventEngine';
import { saveLoadSystem } from './SaveLoadSystem';
import endingsData from '../data/endings.json';

// 游戏引擎
export class GameEngine {
  private probabilityCalc: ProbabilityCalculator;
  private endings: Ending[];

  constructor() {
    this.probabilityCalc = new ProbabilityCalculator(Date.now());
    this.endings = endingsData.endings as Ending[];
  }

  // 创建新游戏状态
  createNewGame(): GameState {
    const seed = Date.now();
    this.probabilityCalc.reseed(seed);

    return {
      phase: 'start',
      attributes: { ...INITIAL_ATTRIBUTES },
      initialAttributes: { ...INITIAL_ATTRIBUTES },
      selectedTalents: [],
      currentStage: 'landing',
      currentStageEventCount: 0,
      eventHistory: [],
      flags: {},
      currentEvent: null,
      ending: null,
      randomSeed: seed
    };
  }

  // 获取随机天赋供选择
  getRandomTalentsForSelection(): ReturnType<typeof talentManager.getRandomTalentsForSelection> {
    return talentManager.getRandomTalentsForSelection(this.probabilityCalc);
  }

  // 选择天赋
  selectTalents(state: GameState, talentIds: string[]): GameState {
    if (!talentManager.validateSelection(talentIds)) {
      throw new Error('无效的天赋选择');
    }

    // 计算天赋加成
    const bonuses = talentManager.calculateAttributeBonuses(talentIds);

    return {
      ...state,
      phase: 'attributes',
      selectedTalents: talentIds,
      attributes: attributeSystem.applyChanges(state.attributes, bonuses)
    };
  }

  // 分配属性
  distributeAttributes(state: GameState, attributes: Attributes): GameState {
    const bonusPoints = talentManager.calculateBonusPoints(state.selectedTalents);

    if (!attributeSystem.validateDistribution(attributes, bonusPoints)) {
      throw new Error('无效的属性分配');
    }

    return {
      ...state,
      phase: 'playing',
      attributes,
      initialAttributes: { ...attributes }
    };
  }

  // 获取下一个事件
  getNextEvent(state: GameState): GameEvent | null {
    const triggeredEventIds = state.eventHistory.map(e => e.eventId);

    return eventEngine.selectNextEvent(
      state.currentStage,
      state.attributes,
      state.selectedTalents,
      state.flags,
      triggeredEventIds,
      this.probabilityCalc
    );
  }

  // 开始新事件
  startEvent(state: GameState, event: GameEvent): GameState {
    return {
      ...state,
      currentEvent: event
    };
  }

  // 获取可见选择
  getVisibleChoices(state: GameState): Choice[] {
    if (!state.currentEvent) return [];

    return eventEngine.getVisibleChoices(
      state.currentEvent,
      state.attributes,
      state.selectedTalents,
      state.flags
    );
  }

  // 做出选择
  makeChoice(state: GameState, choiceId: string): GameState {
    if (!state.currentEvent) {
      throw new Error('没有当前事件');
    }

    const choice = state.currentEvent.choices.find(c => c.id === choiceId);
    if (!choice) {
      throw new Error('无效的选择');
    }

    let newState = { ...state };
    let hiddenTriggered = false;

    // 应用基础效果
    if (choice.consequences.attributeChanges) {
      newState.attributes = attributeSystem.applyChanges(
        newState.attributes,
        choice.consequences.attributeChanges
      );
    }

    if (choice.consequences.setFlags) {
      newState.flags = { ...newState.flags };
      for (const flag of choice.consequences.setFlags) {
        newState.flags[flag] = true;
      }
    }

    // 检查隐藏效果
    if (eventEngine.checkHiddenEffect(choice, this.probabilityCalc)) {
      hiddenTriggered = true;

      if (choice.hiddenConsequences) {
        if (choice.hiddenConsequences.attributeChanges) {
          newState.attributes = attributeSystem.applyChanges(
            newState.attributes,
            choice.hiddenConsequences.attributeChanges
          );
        }

        if (choice.hiddenConsequences.setFlags) {
          newState.flags = { ...newState.flags };
          for (const flag of choice.hiddenConsequences.setFlags) {
            newState.flags[flag] = true;
          }
        }
      }
    }

    // 记录历史
    const historyEntry: EventHistoryEntry = {
      eventId: state.currentEvent.id,
      choiceId,
      stage: state.currentStage,
      consequences: choice.consequences,
      hiddenTriggered
    };

    newState.eventHistory = [...newState.eventHistory, historyEntry];
    newState.currentStageEventCount += 1;
    newState.currentEvent = null;

    // 检查是否触发结局
    if (choice.consequences.triggerEnding) {
      newState.ending = choice.consequences.triggerEnding;
      newState.phase = 'ending';
      return newState;
    }

    // 检查游戏失败
    const gameOverCheck = attributeSystem.checkGameOver(newState.attributes);
    if (gameOverCheck.isOver) {
      // 根据失败原因选择结局
      if (gameOverCheck.reason === '存款耗尽') {
        newState.ending = 'ending_home';
      } else {
        newState.ending = 'ending_debt';
      }
      newState.phase = 'ending';
      return newState;
    }

    // 检查是否需要推进阶段
    const triggeredEventIds = newState.eventHistory.map(e => e.eventId);
    const availableEvents = eventEngine.getAvailableEvents(
      newState.currentStage,
      newState.attributes,
      newState.selectedTalents,
      newState.flags,
      triggeredEventIds
    );

    if (eventEngine.shouldAdvanceStage(
      newState.currentStage,
      newState.currentStageEventCount,
      availableEvents.length
    )) {
      const nextStage = eventEngine.getNextStage(newState.currentStage);

      if (nextStage) {
        newState.currentStage = nextStage;
        newState.currentStageEventCount = 0;
      } else {
        // 游戏结束，计算结局
        newState = this.calculateEnding(newState);
      }
    }

    return newState;
  }

  // 计算结局
  calculateEnding(state: GameState): GameState {
    // 按优先级检查结局条件
    const endingPriority = [
      'ending_star',      // 签约艺人（最高）
      'ending_influencer', // 短视频走红
      'ending_featured',   // 稳定特约
      'ending_business',   // 开店扎根
      'ending_crew',       // 转行幕后
      'ending_veteran',    // 横店钉子户
      'ending_home',       // 回老家
      'ending_debt'        // 负债离场（最低）
    ];

    for (const endingId of endingPriority) {
      const ending = this.endings.find(e => e.id === endingId);
      if (ending && this.checkEndingRequirements(state, ending)) {
        return {
          ...state,
          ending: endingId,
          phase: 'ending'
        };
      }
    }

    // 默认结局
    return {
      ...state,
      ending: 'ending_veteran',
      phase: 'ending'
    };
  }

  // 检查结局条件
  private checkEndingRequirements(state: GameState, ending: Ending): boolean {
    const { requirements } = ending;

    // 检查属性要求
    if (!attributeSystem.checkRequirements(
      state.attributes,
      requirements.minAttributes,
      requirements.maxAttributes
    )) {
      return false;
    }

    // 检查标记要求
    if (requirements.requiredFlags) {
      for (const flag of requirements.requiredFlags) {
        if (!state.flags[flag]) {
          return false;
        }
      }
    }

    return true;
  }

  // 获取结局信息
  getEnding(endingId: string): Ending | undefined {
    return this.endings.find(e => e.id === endingId);
  }

  // 获取所有结局
  getAllEndings(): Ending[] {
    return this.endings;
  }

  // 保存游戏
  saveGame(state: GameState): boolean {
    return saveLoadSystem.saveGame(state);
  }

  // 加载游戏
  loadGame(): GameState | null {
    const state = saveLoadSystem.loadGame();
    if (state) {
      this.probabilityCalc.reseed(state.randomSeed);
    }
    return state;
  }

  // 检查是否有存档
  hasSave(): boolean {
    return saveLoadSystem.hasSave();
  }

  // 删除存档
  deleteSave(): void {
    saveLoadSystem.deleteSave();
  }

  // 获取属性评级
  getAttributeRating(attributes: Attributes) {
    return attributeSystem.getAttributeRating(attributes);
  }

  // 获取阶段进度
  getStageProgress(state: GameState): {
    current: number;
    total: number;
    stageName: string;
  } {
    const currentIndex = STAGE_ORDER.indexOf(state.currentStage);
    return {
      current: currentIndex + 1,
      total: STAGE_ORDER.length,
      stageName: state.currentStage
    };
  }
}

// 单例导出
export const gameEngine = new GameEngine();
