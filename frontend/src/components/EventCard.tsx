import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Cloud, Clock, MapPin, Link as LinkIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Event {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  description: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  weblink: string;
  weather?: {
    temp_f: number;
    condition: string;
    humidity: number;
    wind_mph: number;
  };
}

interface EventCardProps {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onUpdateWeather: (eventId: string) => void;
  isUpdatingWeather: boolean;
}

export function EventCard({ event, onEdit, onDelete, onUpdateWeather, isUpdatingWeather }: EventCardProps) {
  // Check if event has passed
  const eventDate = new Date(event.date);
  const now = new Date();
  const hasPassed = eventDate < now;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{event.name}</CardTitle>
        <CardDescription>
          {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-start gap-2 text-sm">
          <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
          <span>{event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}</span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
          <span>{event.street_address}, {event.city}, {event.state} {event.zip_code}</span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <LinkIcon className="h-4 w-4 text-gray-500 mt-0.5" />
          <a
            href={event.weblink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline truncate"
          >
            {event.weblink}
          </a>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>

        {/* Weather Info */}
        {event.weather && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{event.weather.temp_f}°F</p>
                <p className="text-sm text-gray-600">{event.weather.condition}</p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>Humidity: {event.weather.humidity}%</p>
                <p>Wind: {event.weather.wind_mph} mph</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(event)}
          className="flex-1 !text-white"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUpdateWeather(event.id)}
          disabled={isUpdatingWeather || hasPassed}
          className="flex-1 !text-white"
          title={hasPassed ? "Cannot update weather for past events" : "Update weather forecast"}
        >
          {isUpdatingWeather ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Cloud className="h-4 w-4 mr-1" />
          )}
          Weather
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(event.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}