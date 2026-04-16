# Stage 1: Build React Frontend
FROM node:20-slim AS build-stage
WORKDIR /app/portfolio-web
COPY portfolio-web/package*.json ./
RUN npm install
COPY portfolio-web/ .
RUN npm run build

# Stage 2: Python Backend & Unified Server
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies for psycopg2 and other tools
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Copy the pre-built React app from the build-stage
COPY --from=build-stage /app/portfolio-web/dist /app/portfolio-web/dist

# Expose port 7860 (Hugging Face default)
EXPOSE 7860

# Command to run the unified FastAPI + Discord Bot server
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860"]
