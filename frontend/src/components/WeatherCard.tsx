import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Cloud, Droplets, Wind } from "lucide-react";

interface Weather {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

interface WeatherCardProps {
  weather: Weather;
  date: string;
}

export function WeatherCard({ weather, date }: WeatherCardProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="w-5 h-5" />
          Event Weather
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{weather.temperature}°F</div>
          <div>
            <p className="text-gray-600">{weather.condition}</p>
            <p cxlassName="text-sm text-gray-500">{date}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Humidity</p>
              <p className="text-sm">{weather.humidity}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Wind Speed</p>
              <p className="text-sm">{weather.windSpeed} mph</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
