// 游戏数据分析系统
export interface GameEvent {
  type: string;
  data?: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
}

export interface SessionData {
  sessionId: string;
  startTime: number;
  endTime?: number;
  events: GameEvent[];
  // 游戏数据
  selectedTalents?: string[];
  initialAttributes?: Record<string, number>;
  finalAttributes?: Record<string, number>;
  ending?: string;
  choicesMade: number;
  completed: boolean;
}

export interface AnalyticsStats {
  totalSessions: number;
  completedGames: number;
  completionRate: number;
  averagePlayTime: number;
  endingDistribution: Record<string, number>;
  talentPopularity: Record<string, number>;
  choiceDistribution: Record<string, Record<string, number>>;
  dailyStats: Record<string, { sessions: number; completions: number }>;
}

const STORAGE_KEY = 'hengdian_analytics';
const STATS_KEY = 'hengdian_stats';

class Analytics {
  private currentSession: SessionData | null = null;
  private sessionId: string = '';

  constructor() {
    this.initSession();
  }

  private initSession() {
    this.sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.currentSession = {
      sessionId: this.sessionId,
      startTime: Date.now(),
      events: [],
      choicesMade: 0,
      completed: false
    };
  }

  // 追踪事件
  track(eventType: string, data?: Record<string, unknown>) {
    if (!this.currentSession) return;

    const event: GameEvent = {
      type: eventType,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.currentSession.events.push(event);

    // 特殊事件处理
    switch (eventType) {
      case 'game_start':
        break;
      case 'talents_selected':
        this.currentSession.selectedTalents = data?.talents as string[];
        break;
      case 'attributes_set':
        this.currentSession.initialAttributes = data?.attributes as Record<string, number>;
        break;
      case 'choice_made':
        this.currentSession.choicesMade++;
        break;
      case 'game_end':
        this.currentSession.ending = data?.ending as string;
        this.currentSession.finalAttributes = data?.attributes as Record<string, number>;
        this.currentSession.completed = true;
        this.currentSession.endTime = Date.now();
        this.saveSession();
        break;
    }

    // 发送到外部分析服务（如果配置了）
    this.sendToExternalAnalytics(event);
  }

  // 保存会话数据
  private saveSession() {
    if (!this.currentSession) return;

    try {
      const sessions = this.getAllSessions();
      sessions.push(this.currentSession);

      // 只保留最近100个会话
      const recentSessions = sessions.slice(-100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSessions));

      // 更新统计数据
      this.updateStats();
    } catch (e) {
      console.error('Failed to save analytics:', e);
    }
  }

  // 获取所有会话
  getAllSessions(): SessionData[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // 更新统计数据
  private updateStats() {
    const sessions = this.getAllSessions();
    const stats = this.calculateStats(sessions);
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }

  // 计算统计数据
  calculateStats(sessions: SessionData[]): AnalyticsStats {
    const completedSessions = sessions.filter(s => s.completed);

    // 结局分布
    const endingDistribution: Record<string, number> = {};
    completedSessions.forEach(s => {
      if (s.ending) {
        endingDistribution[s.ending] = (endingDistribution[s.ending] || 0) + 1;
      }
    });

    // 天赋人气
    const talentPopularity: Record<string, number> = {};
    sessions.forEach(s => {
      s.selectedTalents?.forEach(t => {
        talentPopularity[t] = (talentPopularity[t] || 0) + 1;
      });
    });

    // 选择分布
    const choiceDistribution: Record<string, Record<string, number>> = {};
    sessions.forEach(s => {
      s.events
        .filter(e => e.type === 'choice_made')
        .forEach(e => {
          const eventId = e.data?.eventId as string;
          const choiceId = e.data?.choiceId as string;
          if (eventId && choiceId) {
            if (!choiceDistribution[eventId]) {
              choiceDistribution[eventId] = {};
            }
            choiceDistribution[eventId][choiceId] =
              (choiceDistribution[eventId][choiceId] || 0) + 1;
          }
        });
    });

    // 日统计
    const dailyStats: Record<string, { sessions: number; completions: number }> = {};
    sessions.forEach(s => {
      const date = new Date(s.startTime).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { sessions: 0, completions: 0 };
      }
      dailyStats[date].sessions++;
      if (s.completed) {
        dailyStats[date].completions++;
      }
    });

    // 平均游戏时长
    const playTimes = completedSessions
      .filter(s => s.endTime)
      .map(s => (s.endTime! - s.startTime) / 1000 / 60); // 分钟
    const averagePlayTime = playTimes.length > 0
      ? playTimes.reduce((a, b) => a + b, 0) / playTimes.length
      : 0;

    return {
      totalSessions: sessions.length,
      completedGames: completedSessions.length,
      completionRate: sessions.length > 0
        ? (completedSessions.length / sessions.length) * 100
        : 0,
      averagePlayTime,
      endingDistribution,
      talentPopularity,
      choiceDistribution,
      dailyStats
    };
  }

  // 获取统计数据
  getStats(): AnalyticsStats {
    try {
      const cached = localStorage.getItem(STATS_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return this.calculateStats(this.getAllSessions());
  }

  // 发送到外部分析服务
  private sendToExternalAnalytics(event: GameEvent) {
    // Google Analytics (如果存在)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.type, {
        event_category: 'game',
        event_label: JSON.stringify(event.data),
        value: event.timestamp
      });
    }

    // 百度统计 (如果存在)
    if (typeof window !== 'undefined' && (window as any)._hmt) {
      (window as any)._hmt.push(['_trackEvent', 'game', event.type, JSON.stringify(event.data)]);
    }
  }

  // 新游戏开始时重置会话
  newSession() {
    // 如果当前会话未完成，也保存一下
    if (this.currentSession && this.currentSession.events.length > 0 && !this.currentSession.completed) {
      this.currentSession.endTime = Date.now();
      this.saveSession();
    }
    this.initSession();
  }

  // 导出数据
  exportData(): string {
    return JSON.stringify({
      sessions: this.getAllSessions(),
      stats: this.getStats(),
      exportTime: new Date().toISOString()
    }, null, 2);
  }

  // 清除数据
  clearData() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STATS_KEY);
  }
}

export const analytics = new Analytics();
