import React from 'react';

interface WeChatGuideProps {
  url: string;
}

export const WeChatGuide: React.FC<WeChatGuideProps> = ({ url }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert('链接已复制！请在浏览器中打开');
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('链接已复制！请在浏览器中打开');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-6 text-center">
      {/* 图标 */}
      <div className="text-6xl mb-6">🎬</div>

      {/* 标题 */}
      <h1 className="text-2xl font-bold text-yellow-400 mb-4">
        重生之我在横店当群演
      </h1>

      {/* 提示信息 */}
      <div className="bg-gray-800/50 rounded-xl p-6 max-w-sm mb-6">
        <p className="text-white text-lg mb-4">
          微信内无法直接打开游戏
        </p>
        <p className="text-gray-400 text-sm mb-4">
          请点击右上角 <span className="text-yellow-400">⋯</span> 菜单
        </p>
        <p className="text-gray-400 text-sm">
          选择「<span className="text-yellow-400">在浏览器中打开</span>」
        </p>
      </div>

      {/* 操作指引图 */}
      <div className="bg-gray-800/30 rounded-xl p-4 mb-6 max-w-xs">
        <div className="flex items-center justify-between text-gray-300 text-sm mb-3">
          <span>第一步</span>
          <span className="text-2xl">👆</span>
        </div>
        <p className="text-gray-400 text-sm mb-4">点击右上角「⋯」</p>

        <div className="flex items-center justify-between text-gray-300 text-sm mb-3">
          <span>第二步</span>
          <span className="text-2xl">🌐</span>
        </div>
        <p className="text-gray-400 text-sm">选择「在浏览器中打开」</p>
      </div>

      {/* 复制链接按钮 */}
      <button
        onClick={handleCopy}
        className="w-full max-w-xs py-4 px-6 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg text-lg transition-all"
      >
        复制链接
      </button>

      <p className="text-gray-500 text-xs mt-4">
        或长按复制链接到浏览器打开
      </p>

      {/* 链接显示 */}
      <div className="mt-4 p-3 bg-gray-800/50 rounded-lg max-w-xs break-all">
        <p className="text-gray-400 text-xs select-all">{url}</p>
      </div>
    </div>
  );
};

// 检测是否在微信浏览器中
export const isWeChatBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
};

export default WeChatGuide;
