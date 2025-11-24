import requests
import weatherapi
from weatherapi.rest import ApiException
from django.conf import settings
from datetime import datetime
import time


class WeatherAPIService:

    @staticmethod
    def get_event_weather(location, date, event_time=None):

        # Configure API with key
        configuration = weatherapi.Configuration()
        configuration.api_key['key'] = settings.WEATHER_API_KEY

        # Create API instance
        api_instance = weatherapi.APIsApi(weatherapi.ApiClient(configuration))

        # Convert date to string if it's a date object
        if isinstance(date, datetime):
            date_str = date.strftime('%Y-%m-%d')
        elif hasattr(date, 'strftime'):  # Handle date objects
            date_str = date.strftime('%Y-%m-%d')
        else:
            date_str = str(date)

        try:
            # Call forecast API
            api_response = api_instance.forecast_weather(
                q=location,
                days=14,
                dt=date_str
            )

            # Extract relevant weather info
            if api_response and isinstance(api_response, dict) and 'forecast' in api_response:
                # Find the matching forecast day
                forecast_day = None
                for day in api_response['forecast']['forecastday']:
                    if day['date'] == date_str:
                        forecast_day = day
                        break

                if not forecast_day:
                    # Fallback to first day if exact match not found
                    forecast_day = api_response['forecast']['forecastday'][0]

                day_data = forecast_day['day']
                condition_data = day_data['condition']

                # If event time is provided, get hourly forecast for that time
                hour_data = None
                if event_time and 'hour' in forecast_day:
                    # Convert event time to hour (e.g., "14:30:00" -> 14)
                    event_hour = event_time.hour if hasattr(event_time, 'hour') else int(str(event_time).split(':')[0])

                    # Find matching hour in forecast
                    for hour in forecast_day['hour']:
                        hour_time = hour['time'].split()[1]  # "2025-11-13 14:00" -> "14:00"
                        hour_num = int(hour_time.split(':')[0])
                        if hour_num == event_hour:
                            hour_data = hour
                            break

                # Use hourly data if available, otherwise use day data
                if hour_data:
                    return {
                        'success': True,
                        'date': forecast_day['date'],
                        'temp_c': hour_data['temp_c'],
                        'temp_f': hour_data['temp_f'],
                        'humidity': hour_data['humidity'],
                        'wind_mph': hour_data['wind_mph'],
                        'condition': hour_data['condition']['text'],
                        'chance_of_rain': hour_data['chance_of_rain'],
                        'chance_of_snow': hour_data['chance_of_snow'],
                        'icon': hour_data['condition']['icon'],
                    }
                else:
                    # Fallback to day-level data
                    return {
                        'success': True,
                        'date': forecast_day['date'],
                        'temp_c': day_data['avgtemp_c'],
                        'temp_f': day_data['avgtemp_f'],
                        'humidity': day_data['avghumidity'],
                        'wind_mph': day_data['maxwind_mph'],
                        'condition': condition_data['text'],
                        'chance_of_rain': day_data['daily_chance_of_rain'],
                        'chance_of_snow': day_data['daily_chance_of_snow'],
                        'icon': condition_data['icon'],
                    }
            else:
                return {
                    'success': False,
                    'error': 'No forecast data available'
                }

        except ApiException as e:
            return {
                'success': False,
                'error': f'Weather API error: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Unexpected error: {str(e)}'
            }


class AddressAPIService:

    @staticmethod
    def _get_usps_access_token():
        """
        Get OAuth access token from USPS using client credentials
        """
        try:
            token_url = "https://apis.usps.com/oauth2/v3/token"

            data = {
                'grant_type': 'client_credentials',
                'client_id': settings.USPS_CONSUMER_KEY,
                'client_secret': settings.USPS_CONSUMER_SECRET,
                'scope': 'addresses'
            }

            response = requests.post(
                token_url,
                data=data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )

            # Debug logging
            print(f"USPS Token Response Status: {response.status_code}")
            print(f"USPS Token Response Body: {response.text}")

            if response.status_code == 200:
                token_data = response.json()
                return token_data.get('access_token')
            else:
                print(f"USPS OAuth failed: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"Error getting USPS token: {str(e)}")
            return None

    @staticmethod
    def validate_and_geocode(street_address, city, state, zip_code):
        """
        Validate address with USPS, then geocode with Nominatim
        Returns coordinates and standardized address
        """
        # Step 1: Get USPS access token
        access_token = AddressAPIService._get_usps_access_token()

        if not access_token:
            return {
                'success': False,
                'error': 'Failed to authenticate with USPS'
            }

        # Step 2: Validate with USPS
        try:
            url = "https://apis.usps.com/addresses/v3/address"

            headers = {
                "Authorization": f"Bearer {access_token}"
            }

            params = {
                "streetAddress": street_address,
                "city": city,
                "state": state,
                "ZIPCode": zip_code
            }

            response = requests.get(url, params=params, headers=headers)

            # Debug logging
            print(f"USPS Validation Status: {response.status_code}")
            print(f"USPS Validation Response: {response.text}")

            data = response.json()

            if response.status_code != 200:
                return {
                    'success': False,
                    'error': f'Address validation failed: {response.text}'
                }

            # Get standardized address
            addr = data.get('address', {})
            standardized = f"{addr.get('streetAddress', '')}, " \
                           f"{addr.get('city', '')}, " \
                           f"{addr.get('state', '')} " \
                           f"{addr.get('ZIPCode', '')}"

        except Exception as e:
            return {
                'success': False,
                'error': f'USPS validation error: {str(e)}'
            }

        # Step 3: Geocode the validated address using Nominatim API
        try:
            # Use the Nominatim API directly
            nominatim_url = "https://nominatim.openstreetmap.org/search"

            params = {
                'q': standardized.strip(),
                'format': 'json',
                'limit': 1,
                'addressdetails': 1
            }

            headers = {
                'User-Agent': 'hostelcore_app'  # Required by Nominatim usage policy
            }

            # Add a small delay to respect Nominatim's usage policy (max 1 request per second)
            time.sleep(1)

            geo_response = requests.get(nominatim_url, params=params, headers=headers, timeout=10)
            geo_data = geo_response.json()

            if not geo_data or len(geo_data) == 0:
                return {
                    'success': False,
                    'error': 'Could not geocode validated address'
                }

            location = geo_data[0]

            return {
                'success': True,
                'standardized_address': standardized.strip(),
                'latitude': float(location['lat']),
                'longitude': float(location['lon']),
                'street': addr.get('streetAddress'),
                'city': addr.get('city'),
                'state': addr.get('state'),
                'zip_code': addr.get('ZIPCode')
            }

        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': 'Geocoding request timed out'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Geocoding error: {str(e)}'
            }