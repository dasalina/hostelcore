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

      let street_address = '';
      let city = '';
      let state = '';
      let zip_code = '';

      // Try multiple regex patterns in order of specificity
      const patterns = [
        // Pattern 1: "Street, City, ST, ZIP" (4 comma-separated parts)
        /^(.+?),\s*([A-Za-z\s]+?),\s*([A-Z]{2}),\s*(\d{5}(?:-\d{4})?)$/,

        // Pattern 2: "Street, City, ST ZIP" (3 parts with ZIP attached to state)
        /^(.+?),\s*([A-Za-z\s]+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/,

        // Pattern 3: Full address with ZIP, minimal commas
        // "123 Main St, Brooklyn, NY 11206" or "123 Main St Brooklyn NY 11206"
        /^(.+?)[,\s]+([A-Za-z\s]+?)[,\s]+([A-Z]{2})[,\s]+(\d{5}(?:-\d{4})?)$/,

        // Pattern 4: Address with state and ZIP (no city comma)
        // "123 Main St Brooklyn NY 11206"
        /^(.+?)\s+([A-Za-z\s]+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/,

        // Pattern 5: Address without ZIP
        // "123 Main St, Brooklyn, NY" or "123 Main St Brooklyn NY"
        /^(.+?)[,\s]+([A-Za-z\s]+?)[,\s]+([A-Z]{2})$/,

      ];

      for (const pattern of patterns) {
        const match = cleaned.match(pattern);
        if (match) {
          // Check if we have 5 capture groups (street, city, state, zip)
          if (match.length === 5) {
            street_address = match[1].trim();
            city = match[2].trim();
            state = match[3].trim();
            zip_code = match[4].trim();
            break;
          }
          // Check if we have 4 capture groups (could be city, state, zip)
          else if (match.length === 4) {
            if (match[3].match(/^\d{5}/)) {
              // City, State, ZIP (no street)
              street_address = '';
              city = match[1].trim();
              state = match[2].trim();
              zip_code = match[3].trim();
            } else {
              // Street, City, State (no ZIP)
              street_address = match[1].trim();
              city = match[2].trim();
              state = match[3].trim();
              zip_code = '';
            }
            break;
          }
        }
      }

      // Fallback: if no pattern matched, treat entire input as street address
      if (!street_address && !city && !state) {
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
