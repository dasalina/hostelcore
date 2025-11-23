import { Calendar } from "lucide-react";

interface DateTimelineProps {
  dates: Date[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateTimeline({ dates, selectedDate, onDateChange }: DateTimelineProps) {
  // Format date as "Monday, November 2nd"
  const formatDate = (date: Date) => {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();

    // Add ordinal suffix (st, nd, rd, th)
    const getOrdinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    return `${dayOfWeek}, ${month} ${day}${getOrdinalSuffix(day)}`;
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="h-full bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-8">
        <Calendar className="w-5 h-5 text-gray-600" />
        <h2 className="text-gray-900">Select Date</h2>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300"></div>

        {/* Date items */}
        <div className="space-y-6">
          {dates.map((date, index) => (
            <div
              key={index}
              className="relative pl-8 cursor-pointer group"
              onClick={() => onDateChange(date)}
            >
              {/* Notch/dot */}
              <div
                className={`absolute left-0 top-2 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all ${
                  isSelected(date)
                    ? 'bg-blue-600 border-blue-600 scale-125'
                    : 'bg-white border-gray-400 group-hover:border-blue-500 group-hover:scale-110'
                }`}
              ></div>

              {/* Date label */}
              <div
                className={`transition-colors ${
                  isSelected(date)
                    ? 'text-blue-600'
                    : 'text-gray-700 group-hover:text-blue-500'
                }`}
              >
                <p className={isSelected(date) ? 'font-medium' : ''}>
                  {formatDate(date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}