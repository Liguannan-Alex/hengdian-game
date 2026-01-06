import { Attributes, ATTRIBUTE_NAMES, DEFAULT_GAME_CONFIG } from './types';

// 属性系统
export class AttributeSystem {
  private config = DEFAULT_GAME_CONFIG;

  // 创建初始属性
  createInitialAttributes(): Attributes {
    return {
      appearance: 1,
      acting: 1,
      connections: 1,
      savings: 1,
      resilience: 1
    };
  }

  // 验证属性分配是否有效
  validateDistribution(attributes: Attributes, bonusPoints: number = 0): boolean {
    const totalPoints = this.getTotalPoints(attributes);
    const expectedPoints = this.config.initialAttributePoints + bonusPoints;

    // 检查总点数
    if (totalPoints !== expectedPoints) {
      return false;
    }

    // 检查每个属性是否在有效范围内
    for (const key of Object.keys(attributes) as Array<keyof Attributes>) {
      if (attributes[key] < this.config.minAttributeValue ||
          attributes[key] > this.config.maxAttributeValue) {
        return false;
      }
    }

    return true;
  }

  // 获取属性总点数
  getTotalPoints(attributes: Attributes): number {
    return Object.values(attributes).reduce((sum, val) => sum + val, 0);
  }

  // 应用属性变化
  applyChanges(
    current: Attributes,
    changes: Partial<Attributes>
  ): Attributes {
    const newAttributes = { ...current };

    for (const key of Object.keys(changes) as Array<keyof Attributes>) {
      if (changes[key] !== undefined) {
        newAttributes[key] = Math.max(
          0,
          Math.min(this.config.maxAttributeValue, current[key] + (changes[key] || 0))
        );
      }
    }

    return newAttributes;
  }

  // 检查属性是否满足条件
  checkRequirements(
    attributes: Attributes,
    minRequired?: Partial<Attributes>,
    maxRequired?: Partial<Attributes>
  ): boolean {
    if (minRequired) {
      for (const key of Object.keys(minRequired) as Array<keyof Attributes>) {
        if (minRequired[key] !== undefined && attributes[key] < minRequired[key]!) {
          return false;
        }
      }
    }

    if (maxRequired) {
      for (const key of Object.keys(maxRequired) as Array<keyof Attributes>) {
        if (maxRequired[key] !== undefined && attributes[key] > maxRequired[key]!) {
          return false;
        }
      }
    }

    return true;
  }

  // 获取属性名称
  getAttributeName(key: keyof Attributes): string {
    return ATTRIBUTE_NAMES[key];
  }

  // 获取属性百分比（用于显示进度条）
  getAttributePercentage(value: number): number {
    return (value / this.config.maxAttributeValue) * 100;
  }

  // 计算属性评级
  getAttributeRating(attributes: Attributes): {
    total: number;
    average: number;
    rating: string;
  } {
    const total = this.getTotalPoints(attributes);
    const average = total / 5;

    let rating: string;
    if (average >= 8) {
      rating = 'S';
    } else if (average >= 7) {
      rating = 'A';
    } else if (average >= 6) {
      rating = 'B';
    } else if (average >= 5) {
      rating = 'C';
    } else if (average >= 4) {
      rating = 'D';
    } else {
      rating = 'E';
    }

    return { total, average, rating };
  }

  // 检查游戏是否失败（存款或韧劲归零）
  checkGameOver(attributes: Attributes): { isOver: boolean; reason?: string } {
    if (attributes.savings <= 0) {
      return { isOver: true, reason: '存款耗尽' };
    }
    if (attributes.resilience <= 0) {
      return { isOver: true, reason: '心态崩溃' };
    }
    return { isOver: false };
  }
}

// 单例导出
export const attributeSystem = new AttributeSystem();
