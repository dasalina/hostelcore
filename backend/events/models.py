from django.db import models
from django.conf import settings


class Event(models.Model):
    name = models.CharField(max_length=200)
    date = models.DateField()
    description = models.TextField()

    # location
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)  # Two-letter state code
    zip_code = models.CharField(max_length=10)

    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    weblink = models.TextField()
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hosted_events"
    )
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date']

    @property
    def full_address(self):
        """Get full address as string for geocoding"""
        return f"{self.street_address}, {self.city}, {self.state} {self.zip_code}"

    def __str__(self):
        return self.name

    def has_passed(self):
        """Check if event has already happened"""
        from django.utils import timezone
        from datetime import datetime

        # Combine date and end_time into a datetime
        event_end = datetime.combine(self.date, self.end_time)

        # Make it timezone-aware
        event_end = timezone.make_aware(event_end)

        return event_end < timezone.now()


class EventWeather(models.Model):
    event = models.OneToOneField(
        Event,
        on_delete=models.CASCADE,
        related_name="weather"
    )

    temp_c = models.FloatField(null=True, blank=True)
    temp_f = models.FloatField(null=True, blank=True)
    humidity = models.IntegerField(null=True, blank=True)
    wind_mph = models.FloatField(null=True, blank=True)
    condition = models.CharField(max_length=100, null=True, blank=True)
    chance_of_rain = models.IntegerField(null=True, blank=True)
    chance_of_snow = models.IntegerField(null=True, blank=True)
    icon_url = models.URLField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Weather for {self.event.name} on {self.last_updated}"

    def needs_update(self):
        """Check if this weather forecast needs updating"""
        from django.utils import timezone

        # If event has passed, no need to update
        if self.event.has_passed():
            return False

        # Check if already updated today after 3 AM
        now = timezone.now()

        if self.last_updated.date() == now.date() and self.last_updated.hour >= 3:
            return False

        if now.hour >= 3 and self.last_updated.date() < now.date():
            return True

        return False