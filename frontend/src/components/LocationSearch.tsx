import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { MapPin, Search } from "lucide-react";

interface FormData {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  radius_miles?: number;
}

interface LocationSearchProps {
  location: string;
  onLocationChange: (location: string) => void;
  radius?: number;
  onSearch: (parsedData: FormData) => void;
}

export function LocationSearch({
  location,
  onLocationChange,
  radius = 10,
  onSearch
}: LocationSearchProps) {

  const parseAddress = (input: string): FormData => {
    const cleaned = input.trim().replace(/\s+/g, ' ');

    // Regex to match "Street, City, ST ZIP" or "Street City ST ZIP" variations
    const regex = /(.*?)[, ]+\s*([A-Za-z ]+)[, ]+\s*([A-Z]{2})(?:\s+(\d{5}))?$/;
    const match = cleaned.match(regex);

    let street_address = '';
    let city = '';
    let state = '';
    let zip_code = '';

    if (match) {
      street_address = match[1].trim();
      city = match[2].trim();
      state = match[3].trim();
      zip_code = match[4]?.trim() || '';
    } else {
      street_address = cleaned;
    }

    return { street_address, city, state, zip_code, radius_miles: radius };
  };

  const handleSearch = () => {
    const parsedData = parseAddress(location);
    onSearch(parsedData);
  };

  return (
    <div>
      <h1 className="mb-6">Find events nearby</h1>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Enter your address (e.g., 123 Main St, Brooklyn, NY 11201)"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} className="gap-2">
          <Search className="w-4 h-4" />
          Search
        </Button>
      </div>
    </div>
  );
}
