import { Attributes, ATTRIBUTE_NAMES, DEFAULT_GAME_CONFIG } from '../core/types';

interface AttributeBarProps {
  attributes: Attributes;
  showLabels?: boolean;
  compact?: boolean;
}

export function AttributeBar({ attributes, showLabels = true, compact = false }: AttributeBarProps) {
  const attributeIcons: Record<keyof Attributes, string> = {
    appearance: '💄',
    acting: '🎭',
    connections: '🤝',
    savings: '💰',
    resilience: '💪'
  };

  const getBarColor = (key: keyof Attributes, value: number): string => {
    const percentage = value / DEFAULT_GAME_CONFIG.maxAttributeValue;

    if (key === 'savings' || key === 'resilience') {
      // 这两个属性低了会危险
      if (percentage <= 0.2) return 'bg-red-500';
      if (percentage <= 0.4) return 'bg-orange-500';
    }

    return 'bg-hengdian-gold';
  };

  if (compact) {
    return (
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(attributes) as Array<keyof Attributes>).map(key => (
          <div
            key={key}
            className="flex items-center gap-1 bg-gray-800 rounded-full px-2 py-1"
            title={ATTRIBUTE_NAMES[key]}
          >
            <span className="text-sm">{attributeIcons[key]}</span>
            <span className={`text-sm font-bold ${
              attributes[key] <= 2 ? 'text-red-400' : 'text-hengdian-gold'
            }`}>
              {attributes[key]}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(Object.keys(attributes) as Array<keyof Attributes>).map(key => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-lg w-6">{attributeIcons[key]}</span>
          {showLabels && (
            <span className="text-gray-400 text-sm w-12">{ATTRIBUTE_NAMES[key]}</span>
          )}
          <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getBarColor(key, attributes[key])}`}
              style={{
                width: `${(attributes[key] / DEFAULT_GAME_CONFIG.maxAttributeValue) * 100}%`
              }}
            />
          </div>
          <span className={`text-sm font-bold w-6 text-right ${
            attributes[key] <= 2 ? 'text-red-400' : 'text-white'
          }`}>
            {attributes[key]}
          </span>
        </div>
      ))}
    </div>
  );
}
