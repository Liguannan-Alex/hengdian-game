import { GameEvent, Choice } from '../core/types';

interface EventCardProps {
  event: GameEvent;
  choices: Choice[];
  onChoose: (choiceId: string) => void;
}

export function EventCard({ event, choices, onChoose }: EventCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl">
      {/* 事件标题 */}
      <div className="bg-gradient-to-r from-hengdian-red to-red-700 px-4 py-3">
        <h3 className="text-xl font-bold text-white">{event.title}</h3>
      </div>

      {/* 事件描述 */}
      <div className="p-4">
        <p className="text-gray-200 leading-relaxed whitespace-pre-line">
          {event.description}
        </p>
      </div>

      {/* 选择列表 */}
      <div className="px-4 pb-4 space-y-3">
        {choices.map((choice, index) => (
          <button
            key={choice.id}
            onClick={() => onChoose(choice.id)}
            className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200 group hover:ring-2 hover:ring-hengdian-gold"
          >
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-hengdian-gold text-hengdian-dark flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform">
                {String.fromCharCode(65 + index)}
              </span>
              <div className="flex-1">
                <p className="text-white font-medium">{choice.text}</p>
                {choice.description && (
                  <p className="text-gray-400 text-sm mt-1">{choice.description}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
