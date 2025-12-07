import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Loader2 } from "lucide-react";
import { EventFormData } from "@/pages/HostPanelPage";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

// US States for dropdown
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

interface EventFormProps {
  formData: EventFormData;
  setFormData: (data: EventFormData) => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  submitText: string;
}

export function EventForm({ formData, setFormData, onSubmit, submitText }: EventFormProps) {
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof EventFormData, string>> = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Event name is required";
    } else if (formData.name.trim().length < 3) {
      errors.name = "Event name must be at least 3 characters";
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters";
    }

    // Date validation
    if (!formData.date) {
      errors.date = "Date is required";
    } else if (formData.date < new Date(new Date().setHours(0, 0, 0, 0))) {
      errors.date = "Date must be in the future";
    }

    // Time validation
    if (!formData.start_time) {
      errors.start_time = "Start time is required";
    }
    if (!formData.end_time) {
      errors.end_time = "End time is required";
    }
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      errors.end_time = "End time must be after start time";
    }

    // Address validation
    if (!formData.street_address.trim()) {
      errors.street_address = "Street address is required";
    }
    if (!formData.city.trim()) {
      errors.city = "City is required";
    }
    if (!formData.state || formData.state.length !== 2) {
      errors.state = "State is required (2 letters)";
    }
    if (!formData.zip_code.trim()) {
      errors.zip_code = "Zip code is required";
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      errors.zip_code = "Zip code must be 5 or 9 digits";
    }

    // Weblink validation
    if (!formData.weblink.trim()) {
      errors.weblink = "Weblink is required";
    } else {
      try {
        new URL(formData.weblink);
      } catch {
        errors.weblink = "Please enter a valid URL";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Event Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter event name"
        />
        {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your event (min 10 characters)"
          rows={3}
        />
        {formErrors.description && <p className="text-sm text-red-600">{formErrors.description}</p>}
      </div>

      <div className="space-y-2">
        <Label>Date *</Label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                value={formData.date ? dayjs(formData.date) : null}
                onChange={(newValue) => {
                  if (newValue) {
                    // Create date in local timezone without time component
                    const localDate = new Date(
                      newValue.year(),
                      newValue.month(),
                      newValue.date()
                    );
                    setFormData({ ...formData, date: localDate });
                  } else {
                    setFormData({ ...formData, date: undefined });
                  }
                }}
                minDate={dayjs()}
                slots={{
                  openPickerIcon: () => null
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                  }
                }}
              />
            </LocalizationProvider>
        {formErrors.date && <p className="text-sm text-red-600">{formErrors.date}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="start_time">Start Time *</Label>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          />
        </div>
        {formErrors.start_time && <p className="text-sm text-red-600">{formErrors.start_time}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="end_time">End Time *</Label>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>
        {formErrors.end_time && <p className="text-sm text-red-600">{formErrors.end_time}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="street_address">Street Address *</Label>
        <Input
          id="street_address"
          value={formData.street_address}
          onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
          placeholder="123 Main St"
        />
        {formErrors.street_address && <p className="text-sm text-red-600">{formErrors.street_address}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="San Francisco"
          />
          {formErrors.city && <p className="text-sm text-red-600">{formErrors.city}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
            <SelectTrigger className="!text-white">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.state && <p className="text-sm text-red-600">{formErrors.state}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zip_code">Zip Code *</Label>
        <Input
          id="zip_code"
          value={formData.zip_code}
          onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
          placeholder="94102"
        />
        {formErrors.zip_code && <p className="text-sm text-red-600">{formErrors.zip_code}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="weblink">Weblink *</Label>
        <Input
          id="weblink"
          type="url"
          value={formData.weblink}
          onChange={(e) => setFormData({ ...formData, weblink: e.target.value })}
          placeholder="https://example.com/event"
        />
        {formErrors.weblink && <p className="text-sm text-red-600">{formErrors.weblink}</p>}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {submitText === "Create Event" ? "Creating..." : "Updating..."}
            </>
          ) : (
            submitText
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}