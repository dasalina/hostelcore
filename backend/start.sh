#!/bin/bash
# Install dependencies from requirements.txt
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Start the server on Railway's assigned port
python manage.py runserver 0.0.0.0:$PORT
