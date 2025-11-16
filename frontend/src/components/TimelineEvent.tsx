import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface TimelineEventProps {
  title: string;
  time: string;
  distance: string;
  position: number; // 0-100%
  isSelected: boolean;
  onClick: () => void;
}

export function TimelineEvent({ title, time, distance, position, isSelected, onClick }: TimelineEventProps) {
  return (
    <div
      className="absolute left-20 right-4 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
      style={{ top: `${position}%` }}
      onClick={onClick}
    >
      <Card className={`p-3 bg-white shadow-md border-l-4 ${isSelected ? 'border-l-blue-600 ring-2 ring-blue-500' : 'border-l-blue-500'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 mb-1">{time}</p>
            <h3 className="mb-2 truncate">{title}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{distance}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
