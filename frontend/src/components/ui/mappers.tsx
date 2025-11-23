export const mapEventFromAPI = (apiEvent: any) => {
  // Parse date as local time to avoid timezone issues
  const [year, month, day] = apiEvent.date.split('-').map(Number);
  const eventDate = new Date(year, month - 1, day);

  // Format date
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Format times
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Create event time in local timezone
  const [hours, minutes] = (apiEvent.start_time || '00:00').split(':').map(Number);
  const eventTime = new Date(year, month - 1, day, hours, minutes);

  return {
    ...apiEvent,
    title: apiEvent.name,
    location: `${apiEvent.street_address}, ${apiEvent.city}, ${apiEvent.state} ${apiEvent.zip_code}`,
    date: formattedDate,
    startTime: formatTime(apiEvent.start_time),
    endTime: formatTime(apiEvent.end_time),
    weather: apiEvent.weather ? {
      temperature: apiEvent.weather.temp_f,
      condition: apiEvent.weather.condition,
      humidity: apiEvent.weather.humidity,
      windSpeed: apiEvent.weather.wind_mph,
    } : null,
    time: eventTime,
  };
};