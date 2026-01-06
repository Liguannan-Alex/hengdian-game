import {
  GameEvent,
  Choice,
  ChoiceCondition,
  Attributes,
  GameStage,
  DEFAULT_GAME_CONFIG,
  STAGE_ORDER
} from './types';
import { ProbabilityCalculator } from './ProbabilitySystem';
import { attributeSystem } from './AttributeSystem';
import { talentManager } from './TalentManager';

// 事件数据导入
import stage1Events from '../data/events/stage1-landing.json';
import stage2Events from '../data/events/stage2-entry.json';
import stage3Events from '../data/events/stage3-grinding.json';
import stage4Events from '../data/events/stage4-crossroad.json';
import stage5Events from '../data/events/stage5-destiny.json';

// 事件引擎
export class EventEngine {
  private events: Map<string, GameEvent>;
  private stageEvents: Map<GameStage, GameEvent[]>;
  private config = DEFAULT_GAME_CONFIG;

  constructor() {
    this.events = new Map();
    this.stageEvents = new Map();
    this.loadEvents();
  }

  // 加载所有事件
  private loadEvents(): void {
    const allEvents = [
      ...stage1Events.events,
      ...stage2Events.events,
      ...stage3Events.events,
      ...stage4Events.events,
      ...stage5Events.events
    ] as GameEvent[];

    for (const event of allEvents) {
      this.events.set(event.id, event);

      // 按阶段分类
      if (!this.stageEvents.has(event.stage)) {
        this.stageEvents.set(event.stage, []);
      }
      this.stageEvents.get(event.stage)!.push(event);
    }
  }

  // 获取指定阶段的所有事件
  getStageEvents(stage: GameStage): GameEvent[] {
    return this.stageEvents.get(stage) || [];
  }

  // 获取指定事件
  getEvent(id: string): GameEvent | undefined {
    return this.events.get(id);
  }

  // 检查事件条件是否满足
  checkEventConditions(
    event: GameEvent,
    attributes: Attributes,
    talents: string[],
    flags: Record<string, boolean>
  ): boolean {
    if (!event.conditions) return true;

    return this.checkConditions(event.conditions, attributes, talents, flags);
  }

  // 检查条件
  private checkConditions(
    conditions: ChoiceCondition,
    attributes: Attributes,
    talents: string[],
    flags: Record<string, boolean>
  ): boolean {
    // 检查属性要求
    if (!attributeSystem.checkRequirements(
      attributes,
      conditions.minAttributes,
      conditions.maxAttributes
    )) {
      return false;
    }

    // 检查天赋要求
    if (conditions.requiredTalents) {
      for (const talent of conditions.requiredTalents) {
        if (!talents.includes(talent)) {
          return false;
        }
      }
    }

    // 检查排斥天赋
    if (conditions.excludedTalents) {
      for (const talent of conditions.excludedTalents) {
        if (talents.includes(talent)) {
          return false;
        }
      }
    }

    // 检查标记要求
    if (conditions.requiredFlags) {
      for (const flag of conditions.requiredFlags) {
        if (!flags[flag]) {
          return false;
        }
      }
    }

    // 检查排斥标记
    if (conditions.excludedFlags) {
      for (const flag of conditions.excludedFlags) {
        if (flags[flag]) {
          return false;
        }
      }
    }

    return true;
  }

  // 获取可用事件列表
  getAvailableEvents(
    stage: GameStage,
    attributes: Attributes,
    talents: string[],
    flags: Record<string, boolean>,
    triggeredEvents: string[]
  ): GameEvent[] {
    const stageEvents = this.getStageEvents(stage);

    return stageEvents.filter(event => {
      // 检查是否已触发
      if (triggeredEvents.includes(event.id)) {
        return false;
      }

      // 检查条件
      return this.checkEventConditions(event, attributes, talents, flags);
    });
  }

  // 选择下一个事件
  selectNextEvent(
    stage: GameStage,
    attributes: Attributes,
    talents: string[],
    flags: Record<string, boolean>,
    triggeredEvents: string[],
    probabilityCalc: ProbabilityCalculator
  ): GameEvent | null {
    const availableEvents = this.getAvailableEvents(
      stage,
      attributes,
      talents,
      flags,
      triggeredEvents
    );

    if (availableEvents.length === 0) {
      return null;
    }

    // 优先处理必触发事件
    const requiredEvents = availableEvents.filter(e => e.isRequired);
    if (requiredEvents.length > 0) {
      return requiredEvents[0];
    }

    // 根据概率选择事件
    const weightedEvents = availableEvents.map(event => {
      let probability = event.baseChance;

      // 应用天赋修正
      const modifier = talentManager.getEventProbabilityModifier(
        talents,
        event.id,
        event.tags
      );
      probability *= modifier;

      return { item: event, weight: probability };
    });

    // 过滤掉概率为0的事件
    const validEvents = weightedEvents.filter(e => e.weight > 0);

    if (validEvents.length === 0) {
      return null;
    }

    return probabilityCalc.weightedRandom(validEvents);
  }

  // 获取选择的可见性
  getVisibleChoices(
    event: GameEvent,
    attributes: Attributes,
    talents: string[],
    flags: Record<string, boolean>
  ): Choice[] {
    return event.choices.filter(choice => {
      if (!choice.visibleCondition) return true;
      return this.checkConditions(choice.visibleCondition, attributes, talents, flags);
    });
  }

  // 检查是否应该进入下一阶段
  shouldAdvanceStage(
    currentStage: GameStage,
    eventCount: number,
    availableEvents: number
  ): boolean {
    const stageConfig = this.config.eventsPerStage[currentStage];

    // 如果没有可用事件，强制推进
    if (availableEvents === 0) {
      return true;
    }

    // 如果达到最大事件数，推进
    if (eventCount >= stageConfig.max) {
      return true;
    }

    // 如果达到最小事件数，有一定概率推进
    if (eventCount >= stageConfig.min) {
      return Math.random() > 0.5;
    }

    return false;
  }

  // 获取下一阶段
  getNextStage(currentStage: GameStage): GameStage | null {
    const currentIndex = STAGE_ORDER.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) {
      return null;
    }
    return STAGE_ORDER[currentIndex + 1];
  }

  // 检查隐藏效果是否触发
  checkHiddenEffect(
    choice: Choice,
    probabilityCalc: ProbabilityCalculator
  ): boolean {
    if (!choice.hiddenChance || !choice.hiddenConsequences) {
      return false;
    }

    return probabilityCalc.check(choice.hiddenChance);
  }
}

// 单例导出
export const eventEngine = new EventEngine();
