# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire application
COPY . .

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Start command
CMD uvicorn src.premium_calculator.api:app --host 0.0.0.0 --port ${PORT:-8000}
