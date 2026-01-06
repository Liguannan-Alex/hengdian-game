import { Talent, Attributes, DEFAULT_GAME_CONFIG } from './types';
import { ProbabilityCalculator } from './ProbabilitySystem';
import talentsData from '../data/talents.json';

// 天赋管理器
export class TalentManager {
  private talents: Map<string, Talent>;
  private config = DEFAULT_GAME_CONFIG;

  constructor() {
    this.talents = new Map();
    this.loadTalents();
  }

  // 加载天赋数据
  private loadTalents(): void {
    for (const talent of talentsData.talents) {
      this.talents.set(talent.id, talent as Talent);
    }
  }

  // 获取所有天赋
  getAllTalents(): Talent[] {
    return Array.from(this.talents.values());
  }

  // 获取初始天赋（可选择的）
  getInitialTalents(): Talent[] {
    return this.getAllTalents().filter(t => t.category === 'initial');
  }

  // 获取指定天赋
  getTalent(id: string): Talent | undefined {
    return this.talents.get(id);
  }

  // 随机选择天赋供玩家选择
  getRandomTalentsForSelection(
    probabilityCalc: ProbabilityCalculator
  ): Talent[] {
    const initialTalents = this.getInitialTalents();
    return probabilityCalc.sample(initialTalents, this.config.talentsToShow);
  }

  // 计算天赋带来的属性加成
  calculateAttributeBonuses(talentIds: string[]): Partial<Attributes> {
    const bonuses: Partial<Attributes> = {};

    for (const id of talentIds) {
      const talent = this.talents.get(id);
      if (talent?.effects.attributeBonuses) {
        for (const key of Object.keys(talent.effects.attributeBonuses) as Array<keyof Attributes>) {
          const value = talent.effects.attributeBonuses[key];
          if (value !== undefined) {
            bonuses[key] = (bonuses[key] || 0) + value;
          }
        }
      }
    }

    return bonuses;
  }

  // 计算天赋带来的额外属性点
  calculateBonusPoints(talentIds: string[]): number {
    const bonuses = this.calculateAttributeBonuses(talentIds);
    return Object.values(bonuses).reduce((sum, val) => sum + (val || 0), 0);
  }

  // 获取天赋的事件概率修正
  getEventProbabilityModifier(
    talentIds: string[],
    eventId?: string,
    eventTags?: string[]
  ): number {
    let modifier = 1;

    for (const id of talentIds) {
      const talent = this.talents.get(id);
      if (talent?.effects.eventModifiers) {
        for (const mod of talent.effects.eventModifiers) {
          // 检查是否匹配事件ID
          if (mod.eventId && eventId === mod.eventId) {
            modifier *= mod.probabilityModifier;
          }
          // 检查是否匹配事件标签
          else if (mod.tag && eventTags?.includes(mod.tag)) {
            modifier *= mod.probabilityModifier;
          }
          // 如果没有指定eventId和tag，则应用到所有事件
          else if (!mod.eventId && !mod.tag) {
            modifier *= mod.probabilityModifier;
          }
        }
      }
    }

    return modifier;
  }

  // 检查天赋是否冲突
  hasTalentConflict(selectedTalents: string[], newTalent: string): boolean {
    const newTalentData = this.talents.get(newTalent);
    if (!newTalentData) return false;

    // 检查新天赋是否与已选天赋冲突
    if (newTalentData.conflictsWith) {
      for (const selected of selectedTalents) {
        if (newTalentData.conflictsWith.includes(selected)) {
          return true;
        }
      }
    }

    // 检查已选天赋是否与新天赋冲突
    for (const selectedId of selectedTalents) {
      const selectedTalent = this.talents.get(selectedId);
      if (selectedTalent?.conflictsWith?.includes(newTalent)) {
        return true;
      }
    }

    return false;
  }

  // 验证天赋选择
  validateSelection(selectedTalents: string[]): boolean {
    // 检查数量
    if (selectedTalents.length !== this.config.talentsToSelect) {
      return false;
    }

    // 检查是否存在
    for (const id of selectedTalents) {
      if (!this.talents.has(id)) {
        return false;
      }
    }

    // 检查冲突
    for (let i = 0; i < selectedTalents.length; i++) {
      for (let j = i + 1; j < selectedTalents.length; j++) {
        if (this.hasTalentConflict([selectedTalents[i]], selectedTalents[j])) {
          return false;
        }
      }
    }

    return true;
  }
}

// 单例导出
export const talentManager = new TalentManager();
