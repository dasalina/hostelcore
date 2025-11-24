import { useEffect, useState } from "react";
import { TimelineEvent } from "./TimelineEvent";

interface Event {
  id: string;
  title: string;
  time: Date;
  distance: string;
}

interface TimelineProps {
  events: Event[];
  selectedEventId: string;
  onEventSelect: (eventId: string) => void;
  selectedDate: Date;
}

export function Timeline({ events, selectedEventId, onEventSelect, selectedDate }: TimelineProps) {
  const [currentTimePosition, setCurrentTimePosition] = useState(0);

  const getPositionFromTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    return (totalMinutes / (24 * 60)) * 100;
  };

  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTimePosition(getPositionFromTime(new Date()));
    };
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <div className="h-screen overflow-y-auto border-l border-gray-200 flex flex-col bg-gray-50">
      {/* Header*/}
      <div className="sticky top-0 z-30 p-4 border-b border-gray-200 bg-white shadow-sm">
        <h2 className="font-bold">
          {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </h2>
        <p className="text-sm text-gray-500">
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </p>
      </div>

      <div className="relative flex-1 min-h-[1200px]">
        {/* Hour markers */}
        {hours.map((hour) => {
          const position = (hour / 24) * 100;
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          const period = hour >= 12 ? "PM" : "AM";
          return (
            <div key={hour} className="absolute left-0 right-0 border-t border-gray-200" style={{ top: `${position}%` }}>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 w-16 pl-2">{displayHour} {period}</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
            </div>
          );
        })}

        {/* Current time indicator */}
        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `${currentTimePosition}%` }}>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 ml-1"></div>
            <div className="flex-1 h-0.5 bg-red-500"></div>
          </div>
        </div>

        {/* Events */}
        {events.map((event) => (
          <TimelineEvent
            key={event.id}
            title={event.title}
            time={formatTime(event.time)}
            distance={event.distance}
            position={getPositionFromTime(event.time)}
            isSelected={event.id === selectedEventId}
            onClick={() => onEventSelect(event.id)}
          />
        ))}
      </div>
    </div>
  );
}