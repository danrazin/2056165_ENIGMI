import asyncio
import json
import websockets

from kafka import KafkaProducer
from collectors.normalizer import normalize_event


BASE_WS = "ws://simulator:8080/api/telemetry/ws"
KAFKA_BROKER = "kafka:9092"
KAFKA_TOPIC = "mars_normalized_events"

# The initialization of the Producer can block all, it is better to do it synchronous at the start
producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BROKER],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Topics and associated schema
TOPICS = [
    ("topic.power.v1", "mars/telemetry/solar_array"),
    ("topic.power.v1", "mars/telemetry/power_bus"),
    ("topic.power.v1", "mars/telemetry/power_consumption"),

    ("topic.environment.v1", "mars/telemetry/radiation"),
    ("topic.environment.v1", "mars/telemetry/life_support"),

    ("topic.thermal_loop.v1", "mars/telemetry/thermal_loop"),

    ("topic.airlock.v1", "mars/telemetry/airlock")
]


async def consume_topic(schema, topic):

    url = f"{BASE_WS}?topic={topic}"

    while True:
        try:
            print(f"Connecting to {topic}")
            async with websockets.connect(url) as ws:
                async for message in ws:
                    payload = json.loads(message)
                    events = normalize_event(schema, payload)

                    for event in events:
                        # print(json.dumps(event, indent=2)) # BEFORE KAFKA
                        producer.send(KAFKA_TOPIC, event)
                        print(f"WS event sent to Kafka: {event['sensor_id']}")

        except Exception as e:
            print(f"Error with {topic}: {e}")
            await asyncio.sleep(3)


async def main():

    tasks = []

    for schema, topic in TOPICS:
        tasks.append(
            asyncio.create_task(
                consume_topic(schema, topic)
            )
        )

    await asyncio.gather(*tasks)


if __name__ == "__main__":
    asyncio.run(main())
