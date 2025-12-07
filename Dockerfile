FROM python:3.11-slim

# Install system build tools + Node.js
RUN apt-get update && \
    apt-get install -y curl build-essential libpq-dev gcc git && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Upgrade pip and install Cython globally
RUN pip install --upgrade pip setuptools wheel Cython

# Set working directory
WORKDIR /app

# Copy backend requirements and install
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source
COPY backend/ backend/

# Copy frontend source, install, and build
COPY frontend/ frontend/
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Set Python path
ENV PYTHONPATH=/app/backend
WORKDIR /app/backend
EXPOSE 8000

# Build database and start server
COPY backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
CMD ["/app/entrypoint.sh"]