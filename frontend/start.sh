#!/bin/bash
cd frontend
npm install
npm run build
npx serve -s dist -l $PORT
