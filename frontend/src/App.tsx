import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, Cloud, Droplets, Wind, ExternalLink } from 'lucide-react';

import { EventDetails } from '@/components/EventDetailCard';
import { LocationSearch } from '@/components/LocationSearch';
import { Timeline } from '@/components/Timeline';
import { WeatherCard } from '@/components/WeatherCard';
import { QRCodeCard } from '@/components/QRCodeCard';

import { mapEventFromAPI } from '@/components/ui/mappers';


function App() {
  const [location, setLocation] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
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

  const findNearbyEvents = async (data?: typeof formData) => {
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

      // Map API events using the mapper
      const mappedEvents = (responseData.events || []).map(mapEventFromAPI);

      console.log('Mapped events:', mappedEvents);

      setEvents(mappedEvents);
    } catch (err: any) {
      setError(`Failed to fetch events: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDetails = async (eventId) => {
    // Don't clear QR while fetching
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
      // Don't clear QR on error, keep previous one
    }
  };

  return (
    <div className="p-5 max-w-7xl mx-auto flex gap-8">
      <div className="flex-1">
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Selected Event Details */}
        {selectedEvent && (
          <div className="flex-1 p-8 overflow-y-auto flex justify-center">
            <div className="max-w-2xl w-full">
              {console.log('Selected event:', selectedEvent)}
              <EventDetails event={selectedEvent} />

                {/* Weather and QR side by side */}
                <div className="flex gap-6 mt-6 items-stretch">
                  {selectedEvent.weather && (
                    <div className="flex-1">
                      <WeatherCard weather={selectedEvent.weather} />
                    </div>
                  )}

                  {qrCode && (
                    <div className="flex-1">
                      <QRCodeCard qrSvg={qrCode} />
                    </div>
                  )}
                </div>
              </div>
            </div>
        )}
      </div>

      {/* Timeline on the right */}
      <div className="w-96 h-screen sticky top-0">
        {events.length > 0 && (
          <Timeline
            events={events.map(ev => ({
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
        )}
      </div>
    </div>
  );
}

export default App;