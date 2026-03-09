## Unified Event Schema (Standardized Payload)

In order to decouple data ingestion from processing (Rules Engine) and visualization (Dashboard), all heterogeneous data coming from the simulator (both via REST polling and WebSocket streaming) are normalized into a single, flat, and standardized JSON schema before being published to the Kafka message broker (topic: `mars_normalized_events`).

Each single event represents a single measurement over time.

### JSON Event Structure

```json
{
  "event_id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "ts": "2036-03-09T10:15:30Z",
  "sensor_id": "hydroponic_ph_ph_level",
  "value": 6.4,
  "unit": "pH",
  "metadata": {
    "metric": "ph_level",
    "status": "nominal"
  }
}
