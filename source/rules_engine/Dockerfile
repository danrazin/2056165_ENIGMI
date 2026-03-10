FROM python:3.10-slim

WORKDIR /app

RUN pip install --no-cache-dir flask requests kafka-python flask-cors

COPY . .

EXPOSE 5000

CMD ["python", "engine.py"]