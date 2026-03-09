# Mars Automation Platform - Input Documentation

# SYSTEM DESCRIPTION

Mars Automation Platform is a distributed system for monitoring and automating a Mars habitat. 
It ingests sensor data from the simulator using REST polling for static sensors and WebSocket/SSE streaming for telemetry data. 
All heterogeneous data are normalized into a unified JSON schema and published to a Kafka message broker (`mars_normalized_events`), allowing the Rules Engine and Dashboard to process and visualize the information independently. 
The platform separates backend services for ingestion, processing, and presentation.

# USER STORIES:
1)

# STANDARD EVENT SCHEMA

All heterogeneous data from the simulator are normalized into a single JSON schema before publishing to the Kafka topic `mars_normalized_events`. 
Each event represents a single measurement over time.

### JSON Structure

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

# RULE MODEL

The automation rules in the Mars Automation Platform are represented as JSON objects. Each rule defines a condition and a corresponding action that the Rules Engine will execute.

### Rule JSON Schema

```json
{
  "rule_id": "uuid-v4",
  "description": "Brief description of the rule",
  "condition": "Expression using sensor_id and value",
  "action": "Action to perform if the condition is met",
  "enabled": true
}
