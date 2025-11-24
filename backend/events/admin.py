from django.contrib import admin
from .models import Event, EventWeather

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['name', 'date', 'city', 'host']
    list_filter = ['date', 'state']
    search_fields = ['name', 'city']

@admin.register(EventWeather)
class EventWeatherAdmin(admin.ModelAdmin):
    list_display = ['event', 'condition', 'temp_f', 'temp_c', 'humidity', 'wind_mph', 'last_updated']