// EventDetailCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Calendar, MapPin, Clock, ExternalLink } from "lucide-react";

export interface Event {
  title: string;
  description: string;
  date: string;
  location: string;
  startTime: string;
  endTime: string;
  weblink: string;
}

interface EventDetailsProps {
  event: Event;
}

export function EventDetails({ event }: EventDetailsProps) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{event.title || "Event Details"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {event.description && <p className="text-gray-700">{event.description}</p>}

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          {event.date && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p>{event.date}</p>
              </div>
            </div>
          )}

          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p>{event.location}</p>
              </div>
            </div>
          )}

          {event.startTime && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Start Time</p>
                <p>{event.startTime}</p>
              </div>
            </div>
          )}

          {event.endTime && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">End Time</p>
                <p>{event.endTime}</p>
              </div>
            </div>
          )}
        </div>

        {event.weblink && (
          <>
            <Separator />
            <div>
              <a
                href={event.weblink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Visit event website
              </a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
