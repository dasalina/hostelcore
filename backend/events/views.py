import threading
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.contrib.auth.models import User
from django.utils import timezone
from haversine import haversine

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings

import utils

from .models import Event, EventWeather
from .serializers import (
    UserSerializer,
    EventSerializer,
    EventDetailSerializer,
    EventWeatherSerializer,
    FindNearbyInputSerializer
)
from .services import WeatherAPIService, AddressAPIService


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Authenticate user with Google OAuth token
    """
    google_token = request.data.get('google_token')

    if not google_token:
        return Response({
            'error': 'Google token is required'
        }, status=400)

    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            google_token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        # Get user info from Google
        email = idinfo.get('email')
        name = idinfo.get('name')
        google_id = idinfo.get('sub')

        if not email:
            return Response({
                'error': 'Email not provided by Google'
            }, status=400)

        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': name.split()[0] if name else '',
                'last_name': ' '.join(name.split()[1:]) if name and len(name.split()) > 1 else '',
            }
        )

        # Get or create auth token
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.get_full_name() or user.username
            }
        })

    except ValueError as e:
        # Invalid token
        return Response({
            'error': f'Invalid Google token: {str(e)}'
        }, status=400)
    except Exception as e:
        return Response({
            'error': f'Authentication failed: {str(e)}'
        }, status=500)


def fetch_and_save_weather(event_id):
    """Background task to fetch and save weather for an event"""
    try:
        event = Event.objects.get(id=event_id)
        weather_data = WeatherAPIService.get_event_weather(
            location=event.full_address,
            date=event.date,
            event_time=event.start_time
        )

        if weather_data['success']:
            EventWeather.objects.update_or_create(
                event=event,
                defaults={
                    'temp_c': weather_data.get('temp_c'),
                    'temp_f': weather_data.get('temp_f'),
                    'humidity': weather_data.get('humidity'),
                    'wind_mph': weather_data.get('wind_mph'),
                    'condition': weather_data.get('condition'),
                    'chance_of_rain': weather_data.get('chance_of_rain'),
                    'chance_of_snow': weather_data.get('chance_of_snow'),
                    'icon_url': weather_data.get('icon')
                }
            )
    except Exception as e:
        print(f"Background weather fetch failed for event {event_id}: {str(e)}")


class HostViewSet(viewsets.ModelViewSet):
    """
    Host dashboard - FULL CRUD for host's own events
    """
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return only events created by the current user"""
        return Event.objects.filter(host=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create event with validated address, geocoding, and weather forecast"""
        street = request.data.get('street_address', '').strip()
        city = request.data.get('city', '').strip()
        state = request.data.get('state', '').strip()
        zip_code = request.data.get('zip_code', '').strip()

        if not all([street, city, state, zip_code]):
            return Response({
                "error": "street_address, city, state, and zip_code are required"
            }, status=status.HTTP_400_BAD_REQUEST)

        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')

        if not start_time or not end_time:
            return Response({
                "error": "start_time and end_time are required (format: HH:MM:SS)"
            }, status=status.HTTP_400_BAD_REQUEST)

        result = AddressAPIService.validate_and_geocode(
            street, city, state, zip_code
        )

        if not result['success']:
            return Response({
                "error": "Address validation failed",
                "details": result['error']
            }, status=status.HTTP_400_BAD_REQUEST)

        event = Event.objects.create(
            name=request.data.get('name'),
            date=request.data.get('date'),
            description=request.data.get('description'),
            street_address=result['street'],
            city=result['city'],
            state=result['state'],
            zip_code=result['zip_code'],
            latitude=result['latitude'],
            longitude=result['longitude'],
            weblink=request.data.get('weblink'),
            host=request.user,
            start_time=request.data.get('start_time'),
            end_time=request.data.get('end_time')
        )

        if hasattr(event, 'generate_qr_code'):
            event.generate_qr_code()

        threading.Thread(
            target=fetch_and_save_weather,
            args=(event.id,),
            daemon=True
        ).start()

        serializer = self.get_serializer(event)
        return Response({
            "message": "Event created successfully",
            "event": serializer.data,
            "validated_address": result['standardized_address'],
            "coordinates": {
                "latitude": result['latitude'],
                "longitude": result['longitude']
            }
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update event - regenerate QR code if location changed"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_date = instance.date

        address_changed = any([
            request.data.get('street_address') and request.data.get('street_address') != instance.street_address,
            request.data.get('city') and request.data.get('city') != instance.city,
            request.data.get('state') and request.data.get('state') != instance.state,
            request.data.get('zip_code') and request.data.get('zip_code') != instance.zip_code,
        ])

        if address_changed:
            street = request.data.get('street_address', instance.street_address).strip()
            city = request.data.get('city', instance.city).strip()
            state = request.data.get('state', instance.state).strip()
            zip_code = request.data.get('zip_code', instance.zip_code).strip()

            result = AddressAPIService.validate_and_geocode(
                street, city, state, zip_code
            )

            if not result['success']:
                return Response({
                    "error": "Address validation failed",
                    "details": result['error']
                }, status=status.HTTP_400_BAD_REQUEST)

            request.data['street_address'] = result['street']
            request.data['city'] = result['city']
            request.data['state'] = result['state']
            request.data['zip_code'] = result['zip_code']
            request.data['latitude'] = result['latitude']
            request.data['longitude'] = result['longitude']

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        event = serializer.instance

        if address_changed and hasattr(event, 'generate_qr_code'):
            event.generate_qr_code()

        date_changed = request.data.get('date') and request.data.get('date') != str(old_date)
        if address_changed or date_changed:
            threading.Thread(
                target=fetch_and_save_weather,
                args=(event.id,),
                daemon=True
            ).start()

        return Response({
            "message": "Event updated successfully",
            "event": serializer.data,
            "qr_regenerated": address_changed,
            "weather_updating": address_changed or date_changed
        })

    def destroy(self, request, *args, **kwargs):
        """Delete event"""
        instance = self.get_object()
        event_name = instance.name
        self.perform_destroy(instance)
        return Response({
            "message": f"Event '{event_name}' deleted successfully"
        }, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def update_weather(self, request, pk=None):
        """Manually update weather forecast for an event"""
        event = self.get_object()

        if event.has_passed():
            return Response({
                "error": "Cannot update weather for past events"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            weather_data = WeatherAPIService.get_event_weather(
                location=event.full_address,
                date=event.date,
                event_time=event.start_time
            )

            if not weather_data['success']:
                return Response({
                    "error": "Failed to fetch weather",
                    "details": weather_data.get('error')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            weather, created = EventWeather.objects.update_or_create(
                event=event,
                defaults={
                    'temp_c': weather_data.get('temp_c'),
                    'temp_f': weather_data.get('temp_f'),
                    'humidity': weather_data.get('humidity'),
                    'wind_mph': weather_data.get('wind_mph'),
                    'condition': weather_data.get('condition'),
                    'chance_of_rain': weather_data.get('chance_of_rain'),
                    'chance_of_snow': weather_data.get('chance_of_snow'),
                    'icon_url': weather_data.get('icon')
                }
            )

            weather_serializer = EventWeatherSerializer(weather)
            return Response({
                "message": "Weather updated successfully",
                "weather": weather_serializer.data
            })

        except Exception as e:
            return Response({
                "error": f"Weather update failed: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicEventViewSet(viewsets.ReadOnlyModelViewSet):
    """All events - read-only public listing"""
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def find_nearby(self, request):
        """Validate address and find nearby upcoming events within radius"""
        input_serializer = FindNearbyInputSerializer(data=request.data)
        if not input_serializer.is_valid():
            return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = input_serializer.validated_data
        street = validated_data['street_address']
        city = validated_data['city']
        state = validated_data['state']
        zip_code = validated_data['zip_code']
        radius = float(validated_data.get('radius_miles', 10))

        result = AddressAPIService.validate_and_geocode(
            street, city, state, zip_code
        )

        if not result['success']:
            return Response({
                "error": "Address validation failed",
                "details": result['error']
            }, status=status.HTTP_400_BAD_REQUEST)

        user_lat = result['latitude']
        user_lon = result['longitude']
        user_coords = (user_lat, user_lon)

        now = timezone.now()
        upcoming_events = Event.objects.filter(
            date__gte=now.date(),
            latitude__isnull=False,
            longitude__isnull=False
        ).select_related('weather')

        print(f"Total events in DB: {Event.objects.count()}")
        print(f"Upcoming events with coords: {upcoming_events.count()}")
        print(f"User searching from: {user_lat}, {user_lon}")

        events_with_distance = []

        for event in upcoming_events:
            event_coords = (event.latitude, event.longitude)
            distance = haversine(user_coords, event_coords, unit='mi')

            print(f"Event: {event.name} at ({event.latitude}, {event.longitude})")
            print(f"Distance: {distance:.2f} miles")
            print(f"Within radius? {distance <= radius}")

            if distance <= radius:
                events_with_distance.append({
                    'event': event,
                    'distance': round(distance, 2)
                })

        events_with_distance.sort(key=lambda x: x['distance'])

        serializer = EventDetailSerializer(
            [item['event'] for item in events_with_distance],
            many=True
        )

        response_data = serializer.data
        for i, item in enumerate(response_data):
            item['distance_miles'] = events_with_distance[i]['distance']

        return Response({
            'validated_address': result['standardized_address'],
            'user_coordinates': {
                'latitude': user_lat,
                'longitude': user_lon
            },
            'radius_miles': radius,
            'events_found': len(response_data),
            'events': response_data
        })


class DashboardViewSet(viewsets.ReadOnlyModelViewSet):
    """User dashboard view - detailed events with weather"""
    serializer_class = EventDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return events hosted by current user"""
        return Event.objects.filter(host=self.request.user).select_related('weather')


class EventPanelViewSet(viewsets.ReadOnlyModelViewSet):
    """Single event details with weather and directions QR code"""
    queryset = Event.objects.all().select_related('weather')
    serializer_class = EventDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'

    def retrieve(self, request, *args, **kwargs):
        """Get single event with weather and optional directions QR code"""
        event = self.get_object()

        serializer = self.get_serializer(event)
        data = serializer.data

        origin = request.query_params.get('origin', None)
        travelmode = request.query_params.get('travelmode', 'driving')

        valid_travelmodes = ['driving', 'walking', 'bicycling', 'transit']
        if travelmode not in valid_travelmodes:
            travelmode = 'driving'

        if origin:
            destination = event.full_address

            qr_result = utils.generate_google_maps_qr(
                origin=origin,
                destination=destination,
                travelmode=travelmode
            )

            if qr_result:
                print(f"QR Code URL: {qr_result.get('url')}")
                data['directions_qr'] = {
                    'svg': qr_result['svg'],
                    'origin': origin,
                    'destination': destination,
                    'travelmode': travelmode,
                    'generated': True
                }
            else:
                data['directions_qr'] = {
                    'generated': False,
                    'error': 'Failed to generate directions QR code'
                }
        else:
            data['directions_qr'] = {
                'generated': False,
                'message': 'Provide origin query parameter for directions QR code'
            }

        return Response(data)