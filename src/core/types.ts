// 游戏属性
export interface Attributes {
  appearance: number;  // 颜值
  acting: number;      // 演技
  connections: number; // 人脉
  savings: number;     // 存款
  resilience: number;  // 韧劲
}

// 属性名称映射
export const ATTRIBUTE_NAMES: Record<keyof Attributes, string> = {
  appearance: '颜值',
  acting: '演技',
  connections: '人脉',
  savings: '存款',
  resilience: '韧劲'
};

// 属性描述
export const ATTRIBUTE_DESCRIPTIONS: Record<keyof Attributes, string> = {
  appearance: '能不能被挑中、能不能上特写',
  acting: '能不能升咖位、副导演愿不愿意用你',
  connections: '群头、副导演、服化道的关系网',
  savings: '没戏拍的时候能撑多久',
  resilience: '心态是否崩溃、还能不能扛下去'
};

// 游戏阶段
export type GameStage = 'landing' | 'entry' | 'grinding' | 'crossroad' | 'destiny';

// 阶段名称映射
export const STAGE_NAMES: Record<GameStage, string> = {
  landing: '落地',
  entry: '入行',
  grinding: '磨合',
  crossroad: '抉择',
  destiny: '定局'
};

// 阶段描述
export const STAGE_DESCRIPTIONS: Record<GameStage, string> = {
  landing: '第1天 - 拖着行李箱下高铁',
  entry: '第1周 - 找房、办证、接第一单',
  grinding: '1-3月 - 普通群演，跑场子',
  crossroad: '第1年 - 向上冲还是另谋出路',
  destiny: '第3年 - 你变成了谁'
};

// 天赋
export interface Talent {
  id: string;
  name: string;
  description: string;
  category: 'initial' | 'unlocked';
  effects: {
    attributeBonuses?: Partial<Attributes>;
    eventModifiers?: Array<{
      eventId?: string;
      tag?: string;
      probabilityModifier: number;
    }>;
  };
  conflictsWith?: string[];
}

// 选择结果
export interface ChoiceConsequences {
  attributeChanges?: Partial<Attributes>;
  setFlags?: string[];
  unlockTalents?: string[];
  triggerEnding?: string;
  nextEventId?: string;
}

// 选择
export interface Choice {
  id: string;
  text: string;
  description?: string;
  visibleCondition?: ChoiceCondition;
  consequences: ChoiceConsequences;
  hiddenChance?: number;  // 暗骰成功时的额外效果概率
  hiddenConsequences?: ChoiceConsequences;  // 暗骰成功时的额外效果
}

// 条件
export interface ChoiceCondition {
  minAttributes?: Partial<Attributes>;
  maxAttributes?: Partial<Attributes>;
  requiredTalents?: string[];
  excludedTalents?: string[];
  requiredFlags?: string[];
  excludedFlags?: string[];
}

// 事件
export interface GameEvent {
  id: string;
  stage: GameStage;
  title: string;
  description: string;
  conditions?: ChoiceCondition;
  baseChance: number;
  isRequired?: boolean;  // 必触发事件
  tags?: string[];
  choices: Choice[];
}

// 结局类型
export type EndingType = 'upper' | 'middle' | 'lower';

// 结局
export interface Ending {
  id: string;
  name: string;
  type: EndingType;
  icon: string;
  title: string;
  description: string;
  requirements: ChoiceCondition;
  epilogue: string;
}

// 结局类型名称
export const ENDING_TYPE_NAMES: Record<EndingType, string> = {
  upper: '上行线',
  middle: '平行线',
  lower: '下行线'
};

// 游戏阶段
export type GamePhase = 'start' | 'talents' | 'attributes' | 'playing' | 'ending';

// 事件历史记录
export interface EventHistoryEntry {
  eventId: string;
  choiceId: string;
  stage: GameStage;
  consequences: ChoiceConsequences;
  hiddenTriggered?: boolean;
}

// 游戏状态
export interface GameState {
  phase: GamePhase;
  attributes: Attributes;
  initialAttributes: Attributes;
  selectedTalents: string[];
  currentStage: GameStage;
  currentStageEventCount: number;
  eventHistory: EventHistoryEntry[];
  flags: Record<string, boolean>;
  currentEvent: GameEvent | null;
  ending: string | null;
  randomSeed: number;
}

// 游戏配置
export interface GameConfig {
  initialAttributePoints: number;
  maxAttributeValue: number;
  minAttributeValue: number;
  talentsToSelect: number;
  talentsToShow: number;
  eventsPerStage: Record<GameStage, { min: number; max: number }>;
}

// 默认游戏配置
export const DEFAULT_GAME_CONFIG: GameConfig = {
  initialAttributePoints: 20,
  maxAttributeValue: 10,
  minAttributeValue: 1,
  talentsToSelect: 3,
  talentsToShow: 10,
  eventsPerStage: {
    landing: { min: 3, max: 5 },
    entry: { min: 4, max: 6 },
    grinding: { min: 5, max: 7 },
    crossroad: { min: 4, max: 6 },
    destiny: { min: 2, max: 4 }
  }
};

// 初始属性
export const INITIAL_ATTRIBUTES: Attributes = {
  appearance: 5,
  acting: 5,
  connections: 3,
  savings: 5,
  resilience: 5
};

// 阶段顺序
export const STAGE_ORDER: GameStage[] = ['landing', 'entry', 'grinding', 'crossroad', 'destiny'];
