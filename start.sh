#!/bin/bash

# Start backend in background
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:$PORT &

# Start frontend
cd ../frontend
npm install
npm run build
npx serve -s dist -l 3000
