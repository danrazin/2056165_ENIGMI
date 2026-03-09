import asyncio
import json
import websockets

from collectors.normalizer import normalize_event


BASE_WS = "ws://localhost:8080/api/telemetry/ws"

# topic and associated schema
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
            print(f"Connected to {topic}")
            async with websockets.connect(url) as ws:
                async for message in ws:
                    payload = json.loads(message)
                    events = normalize_event(schema, payload)
                    for event in events:
                        print(json.dumps(event, indent=2))

        except Exception as e:
            print(f"Error on {topic}: {e}")
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
