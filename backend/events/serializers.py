from django.contrib.auth.models import User
from .models import Event, EventWeather
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}


class EventWeatherSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventWeather
        fields = [
            'temp_c', 'temp_f', 'humidity', 'wind_mph',
            'condition', 'chance_of_rain', 'chance_of_snow',
            'icon_url', 'last_updated'
        ]


class EventSerializer(serializers.ModelSerializer):
    host_name = serializers.CharField(source='host.username', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'name', 'date', 'description',
            'street_address', 'city', 'state', 'zip_code',
            'latitude', 'longitude',
            'weblink', 'host', 'host_name', 'start_time', 'end_time'
        ]
        read_only_fields = ['id', 'host', 'latitude', 'longitude']


class EventDetailSerializer(serializers.ModelSerializer):
    """Detailed event view with weather"""
    weather = EventWeatherSerializer(read_only=True)
    host_name = serializers.CharField(source='host.username', read_only=True)
    full_address = serializers.CharField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'name', 'date', 'start_time', 'end_time',
            'description', 'street_address', 'city', 'state', 'zip_code',
            'full_address', 'latitude', 'longitude',
            'weblink', 'host_name', 'weather'
        ]


class FindNearbyInputSerializer(serializers.Serializer):
    """Input serializer for find_nearby endpoint"""
    street_address = serializers.CharField(required=True, max_length=255)
    city = serializers.CharField(required=True, max_length=100)
    state = serializers.CharField(required=True, max_length=2)
    zip_code = serializers.CharField(required=True, max_length=10)
    radius_miles = serializers.FloatField(required=False, default=10)