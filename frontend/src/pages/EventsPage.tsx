import { useState } from 'react';
import { EventDetails } from '@/components/EventDetailCard';
import { DateTimeline } from '@/components/DateTimeline';
import { LocationSearch } from '@/components/LocationSearch';
import { Timeline } from '@/components/Timeline';
import { WeatherCard } from '@/components/WeatherCard';
import { QRCodeCard } from '@/components/QRCodeCard';
import { mapEventFromAPI } from '@/components/ui/mappers';

function EventsPage() {
  const [location, setLocation] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [qrCode, setQrCode] = useState(null);
  const [formData, setFormData] = useState({
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    radius_miles: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  const filteredEvents = events.filter((event) => {
    if (!event.time) return false;
    const eventDate = new Date(event.time);
    return (
      eventDate.getFullYear() === selectedDate.getFullYear() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getDate() === selectedDate.getDate()
    );
  });

  const findNearbyEvents = async (data) => {
    const payload = data || formData;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/eventboard/find_nearby/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const responseData = await response.json();

      console.log('Raw API response:', responseData);

      const mappedEvents = (responseData.events || []).map(mapEventFromAPI);

      console.log('Mapped events:', mappedEvents);

      setEvents(mappedEvents);
    } catch (err) {
      setError(`Failed to fetch events: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDetails = async (eventId) => {
    try {
      const origin = `${formData.street_address}, ${formData.city}, ${formData.state} ${formData.zip_code}`;
      const response = await fetch(
        `http://127.0.0.1:8000/api/eventpanel/${eventId}/?origin=${encodeURIComponent(origin)}&travelmode=driving`
      );

      if (!response.ok) {
        console.error('Event panel fetch failed:', response.status);
        return;
      }

      const data = await response.json();
      console.log('Event panel data:', data);

      if (data.directions_qr?.generated) {
        setQrCode(data.directions_qr.svg);
      } else {
        console.log('No QR generated:', data.directions_qr);
        setQrCode(null);
      }
    } catch (err) {
      console.error('Failed to fetch QR:', err);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Left sidebar - Date Timeline */}
      <DateTimeline
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        dates={dates}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-start pt-8 px-8 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Location search */}
          <LocationSearch
            location={location}
            onLocationChange={setLocation}
            radius={formData.radius_miles}
            onSearch={(parsedData) => {
              setFormData(parsedData);
              findNearbyEvents(parsedData);
            }}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
              {error}
            </div>
          )}
        </div>

        {/* Selected Event Details */}
        {selectedEvent && (
          <div className="mt-8 w-full max-w-2xl space-y-4">
            <EventDetails event={selectedEvent} />

            {/* Weather and QR side by side */}
            <div className="grid grid-cols-2 gap-4">
              {selectedEvent.weather && (
                <WeatherCard weather={selectedEvent.weather} />
              )}

              {qrCode && (
                <QRCodeCard qrSvg={qrCode} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar - Timeline */}
      <div className="w-96 h-screen sticky top-0">
        <Timeline
          events={filteredEvents.map(ev => ({
            id: ev.id,
            title: ev.title || ev.name || 'Unnamed Event',
            time: ev.time,
            distance: ev.distance_miles ? `${ev.distance_miles} miles` : 'Distance unknown'
          }))}
          selectedEventId={selectedEvent?.id || ''}
          onEventSelect={(eventId) => {
            const ev = events.find(e => e.id === eventId);
            console.log('Setting selected event:', ev);
            if (ev) {
              setSelectedEvent(ev);
              fetchEventDetails(eventId);
            }
          }}
        />
      </div>
    </div>
  );
}

export default EventsPage;