FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Pillow and PostgreSQL client
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    postgresql-client \
    libjpeg-dev \
    zlib1g-dev \
    libwebp-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Create uploads directory structure
RUN mkdir -p /app/uploads/originals /app/uploads/thumbnails

EXPOSE 5000

ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

CMD ["python", "run.py"]
