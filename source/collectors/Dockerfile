FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Default command ==> Ignored and overwritten by docker-compose
CMD ["python", "collector_rest.py"]
