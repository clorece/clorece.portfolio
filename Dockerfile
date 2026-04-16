# Use a Python 3.10 image
FROM python:3.10-slim

# Install system dependencies for psycopg2 and other tools
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port 7860 (Hugging Face default)
EXPOSE 7860

# Command to run the unified FastAPI + Discord Bot server
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860"]
