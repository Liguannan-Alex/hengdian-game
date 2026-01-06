import { GameState } from './types';

const SAVE_KEY = 'hengdian_game_save';
const SETTINGS_KEY = 'hengdian_game_settings';

// 游戏设置
export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  textSpeed: 'slow' | 'normal' | 'fast';
}

// 默认设置
const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  textSpeed: 'normal'
};

// 存档系统
export class SaveLoadSystem {
  // 保存游戏
  saveGame(state: GameState): boolean {
    try {
      const saveData = {
        state,
        timestamp: Date.now(),
        version: '1.0.0'
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.error('保存游戏失败:', error);
      return false;
    }
  }

  // 加载游戏
  loadGame(): GameState | null {
    try {
      const saveData = localStorage.getItem(SAVE_KEY);
      if (!saveData) return null;

      const parsed = JSON.parse(saveData);
      return parsed.state as GameState;
    } catch (error) {
      console.error('加载游戏失败:', error);
      return null;
    }
  }

  // 检查是否有存档
  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  // 删除存档
  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  // 获取存档时间
  getSaveTimestamp(): Date | null {
    try {
      const saveData = localStorage.getItem(SAVE_KEY);
      if (!saveData) return null;

      const parsed = JSON.parse(saveData);
      return new Date(parsed.timestamp);
    } catch {
      return null;
    }
  }

  // 保存设置
  saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  // 加载设置
  loadSettings(): GameSettings {
    try {
      const settingsData = localStorage.getItem(SETTINGS_KEY);
      if (!settingsData) return DEFAULT_SETTINGS;

      return { ...DEFAULT_SETTINGS, ...JSON.parse(settingsData) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  // 导出存档为字符串（用于分享或备份）
  exportSave(): string | null {
    try {
      const saveData = localStorage.getItem(SAVE_KEY);
      if (!saveData) return null;

      return btoa(saveData);
    } catch (error) {
      console.error('导出存档失败:', error);
      return null;
    }
  }

  // 导入存档
  importSave(encodedData: string): boolean {
    try {
      const saveData = atob(encodedData);
      const parsed = JSON.parse(saveData);

      // 验证数据格式
      if (!parsed.state || !parsed.timestamp || !parsed.version) {
        throw new Error('无效的存档格式');
      }

      localStorage.setItem(SAVE_KEY, saveData);
      return true;
    } catch (error) {
      console.error('导入存档失败:', error);
      return false;
    }
  }
}

// 单例导出
export const saveLoadSystem = new SaveLoadSystem();
