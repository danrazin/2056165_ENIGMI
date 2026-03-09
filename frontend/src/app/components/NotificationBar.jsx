import { useEffect, useRef } from 'react';

export function NotificationBar({ events }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="bg-gray-800 border-t border-gray-700 p-4">
      <h3 className="text-white font-semibold mb-2">Event Log ({events.length})</h3>
      
      <div 
        ref={scrollRef}
        className="h-24 overflow-y-auto space-y-1"
      >
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-2 bg-gray-700 rounded p-2 text-sm"
          >
            <span className={`text-xs px-2 py-0.5 rounded ${
              event.type === 'success' ? 'bg-green-600' :
              event.type === 'warning' ? 'bg-amber-600' :
              'bg-blue-600'
            } text-white`}>
              {event.type.toUpperCase()}
            </span>
            <span className="text-gray-300 flex-1">{event.message}</span>
            <span className="text-gray-500 text-xs">{event.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
