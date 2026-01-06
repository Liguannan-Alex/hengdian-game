// 伪随机数生成器 (使用 xorshift128+)
export class PRNG {
  private state: [number, number];

  constructor(seed: number) {
    // 使用种子初始化状态
    this.state = [seed, seed ^ 0x6c078965];
  }

  // 生成 0-1 之间的随机数
  next(): number {
    let s1 = this.state[0];
    const s0 = this.state[1];
    this.state[0] = s0;
    s1 ^= s1 << 23;
    s1 ^= s1 >> 17;
    s1 ^= s0;
    s1 ^= s0 >> 26;
    this.state[1] = s1;
    return (this.state[0] + this.state[1]) / 4294967296 + 0.5;
  }

  // 生成指定范围内的整数
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // 从数组中随机选择 n 个元素
  sample<T>(array: T[], n: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, n);
  }

  // 保存状态
  getState(): [number, number] {
    return [...this.state];
  }

  // 恢复状态
  setState(state: [number, number]): void {
    this.state = [...state];
  }
}

// 概率计算器
export class ProbabilityCalculator {
  private prng: PRNG;

  constructor(seed: number) {
    this.prng = new PRNG(seed);
  }

  // 检查是否触发（基于概率）
  check(probability: number): boolean {
    return this.prng.next() < probability;
  }

  // 应用概率修正因子
  applyModifier(baseProbability: number, modifier: number): number {
    return Math.min(1, Math.max(0, baseProbability * modifier));
  }

  // 获取随机数
  random(): number {
    return this.prng.next();
  }

  // 获取随机整数
  randomInt(min: number, max: number): number {
    return this.prng.nextInt(min, max);
  }

  // 从数组中随机选择
  sample<T>(array: T[], n: number): T[] {
    return this.prng.sample(array, n);
  }

  // 加权随机选择
  weightedRandom<T>(items: Array<{ item: T; weight: number }>): T {
    const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
    let random = this.prng.next() * totalWeight;

    for (const { item, weight } of items) {
      random -= weight;
      if (random <= 0) {
        return item;
      }
    }

    return items[items.length - 1].item;
  }

  // 获取种子（用于保存游戏）
  getSeed(): number {
    return this.prng.getState()[0];
  }

  // 重新设置种子
  reseed(seed: number): void {
    this.prng = new PRNG(seed);
  }
}
