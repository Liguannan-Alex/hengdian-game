import React, { useState, useEffect } from 'react';
import { analytics, AnalyticsStats } from '../core/Analytics';
import talentsData from '../data/talents.json';
import endingsData from '../data/endings.json';

const ENDING_NAMES: Record<string, string> = {};
endingsData.endings.forEach((e: { id: string; title: string }) => {
  ENDING_NAMES[e.id] = e.title;
});

const TALENT_NAMES: Record<string, string> = {};
talentsData.talents.forEach((t: { id: string; name: string }) => {
  TALENT_NAMES[t.id] = t.name;
});

interface StatsPanelProps {
  onClose: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ onClose }) => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'endings' | 'talents' | 'daily'>('overview');

  useEffect(() => {
    setStats(analytics.getStats());
  }, []);

  if (!stats) return null;

  const formatTime = (minutes: number) => {
    if (minutes < 1) return '< 1 分钟';
    if (minutes < 60) return `${Math.round(minutes)} 分钟`;
    return `${Math.floor(minutes / 60)} 小时 ${Math.round(minutes % 60)} 分钟`;
  };

  const sortedEndings = Object.entries(stats.endingDistribution)
    .sort(([, a], [, b]) => b - a);

  const sortedTalents = Object.entries(stats.talentPopularity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const sortedDays = Object.entries(stats.dailyStats)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);

  const totalEndings = sortedEndings.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-yellow-600/30">
        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-yellow-600 to-amber-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">数据统计</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Tab 导航 */}
        <div className="flex border-b border-gray-700">
          {[
            { key: 'overview', label: '总览' },
            { key: 'endings', label: '结局分布' },
            { key: 'talents', label: '天赋人气' },
            { key: 'daily', label: '每日统计' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-yellow-400 border-b-2 border-yellow-400 bg-gray-800/50'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="总游戏次数"
                value={stats.totalSessions.toString()}
                icon="🎮"
              />
              <StatCard
                label="完成游戏"
                value={stats.completedGames.toString()}
                icon="🏆"
              />
              <StatCard
                label="完成率"
                value={`${stats.completionRate.toFixed(1)}%`}
                icon="📊"
              />
              <StatCard
                label="平均时长"
                value={formatTime(stats.averagePlayTime)}
                icon="⏱️"
              />
            </div>
          )}

          {activeTab === 'endings' && (
            <div className="space-y-3">
              {sortedEndings.length === 0 ? (
                <p className="text-gray-400 text-center py-8">暂无结局数据</p>
              ) : (
                sortedEndings.map(([endingId, count]) => (
                  <div key={endingId} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">
                        {ENDING_NAMES[endingId] || endingId}
                      </span>
                      <span className="text-yellow-400">{count} 次</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full"
                        style={{ width: `${(count / totalEndings) * 100}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-gray-400 mt-1">
                      {((count / totalEndings) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'talents' && (
            <div className="space-y-3">
              {sortedTalents.length === 0 ? (
                <p className="text-gray-400 text-center py-8">暂无天赋数据</p>
              ) : (
                sortedTalents.map(([talentId, count], index) => (
                  <div key={talentId} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                    <span className="text-2xl w-8 text-center">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                    </span>
                    <div className="flex-1">
                      <span className="text-white">{TALENT_NAMES[talentId] || talentId}</span>
                    </div>
                    <span className="text-yellow-400 font-medium">{count} 次选择</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'daily' && (
            <div className="space-y-3">
              {sortedDays.length === 0 ? (
                <p className="text-gray-400 text-center py-8">暂无每日数据</p>
              ) : (
                sortedDays.map(([date, data]) => (
                  <div key={date} className="bg-gray-800/50 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-white">{date}</span>
                    <div className="text-right">
                      <div className="text-yellow-400">{data.sessions} 次游戏</div>
                      <div className="text-sm text-gray-400">{data.completions} 次完成</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="px-6 py-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={() => {
              const data = analytics.exportData();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `hengdian-stats-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            导出数据
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: string }> = ({
  label,
  value,
  icon
}) => (
  <div className="bg-gray-800/50 rounded-lg p-4 text-center">
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-2xl font-bold text-yellow-400 mb-1">{value}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
);

export default StatsPanel;
