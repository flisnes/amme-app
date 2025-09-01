import json
import datetime
import random

UTC = datetime.timezone.utc

def iso_z(dt: datetime.datetime) -> str:
    """Return an RFC3339/ISO8601 UTC string with 'Z'."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    else:
        dt = dt.astimezone(UTC)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def generate_dummy_data():
    # Today (UTC), end of day for completeness
    now_utc = datetime.datetime.now(UTC)
    end_date = now_utc.replace(hour=23, minute=59, second=59, microsecond=0)

    # ~3 months back (90 days), start of day
    start_date = (end_date - datetime.timedelta(days=90)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    activities = []
    activity_id = int(start_date.timestamp() * 1000)

    current_date = start_date

    while current_date.date() <= end_date.date():
        daily_activities = []

        # Night sleep (usually 10-12 hours with interruptions)
        if random.random() > 0.1:  # 90% chance of logging night sleep
            sleep_start = current_date.replace(
                hour=random.randint(21, 23), minute=random.randint(0, 59)
            )
            sleep_duration = random.randint(600, 720)  # 10-12 hours in minutes
            sleep_end = sleep_start + datetime.timedelta(minutes=sleep_duration)

            daily_activities.append({
                "id": str(activity_id),
                "type": "sleep",
                "startTime": iso_z(sleep_start),
                "endTime": iso_z(sleep_end)
            })
            activity_id += 1

        # Day activities (6 AM to 10 PM)
        day_start = current_date.replace(hour=6, minute=0)
        day_end = current_date.replace(hour=22, minute=0)

        # Generate 6-10 feedings per day
        feeding_count = random.randint(6, 10)
        feeding_types = ['left', 'right', 'bottle']

        for i in range(feeding_count):
            hour_offset = (16 * i) // feeding_count + random.randint(-1, 1)
            feeding_time = day_start + datetime.timedelta(
                hours=hour_offset, minutes=random.randint(0, 59)
            )

            if feeding_time <= day_end:
                duration = random.randint(15, 35)  # 15-35 minutes
                end_time = feeding_time + datetime.timedelta(minutes=duration)

                activity = {
                    "id": str(activity_id),
                    "type": "breastfeeding",
                    "startTime": iso_z(feeding_time),
                    "endTime": iso_z(end_time),
                    "feedingType": random.choice(feeding_types)
                }

                if random.random() > 0.85:  # 15% chance of being edited
                    original_type = random.choice(
                        [t for t in feeding_types if t != activity["feedingType"]]
                    )
                    original_start = feeding_time - datetime.timedelta(
                        minutes=random.randint(5, 15)
                    )
                    activity["originalFeedingType"] = original_type
                    activity["originalStartTime"] = iso_z(original_start)
                    if random.random() > 0.5:
                        original_end = original_start + datetime.timedelta(
                            minutes=random.randint(20, 40)
                        )
                        activity["originalEndTime"] = iso_z(original_end)

                daily_activities.append(activity)
                activity_id += 1

        # Generate 4-8 diaper changes per day
        diaper_count = random.randint(4, 8)
        diaper_types = ['pee', 'poo', 'both']

        for i in range(diaper_count):
            hour_offset = (16 * i) // diaper_count + random.randint(0, 2)
            diaper_time = day_start + datetime.timedelta(
                hours=hour_offset, minutes=random.randint(0, 59)
            )

            if diaper_time <= day_end:
                end_time = diaper_time + datetime.timedelta(minutes=random.randint(2, 5))

                activity = {
                    "id": str(activity_id),
                    "type": "diaper",
                    "startTime": iso_z(diaper_time),
                    "endTime": iso_z(end_time),
                    "diaperType": random.choice(diaper_types)
                }

                if random.random() > 0.9:  # 10% chance of being edited
                    original_type = random.choice(
                        [t for t in diaper_types if t != activity["diaperType"]]
                    )
                    original_start = diaper_time - datetime.timedelta(
                        minutes=random.randint(5, 10)
                    )
                    activity["originalDiaperType"] = original_type
                    activity["originalStartTime"] = iso_z(original_start)

                daily_activities.append(activity)
                activity_id += 1

        # Generate 1-3 nap periods
        nap_count = random.randint(1, 3)
        for i in range(nap_count):
            nap_periods = [
                (9, 11),   # Morning nap
                (13, 15),  # Afternoon nap
                (17, 19)   # Early evening nap
            ]
            if i < len(nap_periods):
                start_hour, end_hour = nap_periods[i]
                nap_start = current_date.replace(
                    hour=random.randint(start_hour, end_hour - 1),
                    minute=random.randint(0, 59)
                )
                nap_duration = random.randint(30, 120)  # 30 minutes to 2 hours
                nap_end = nap_start + datetime.timedelta(minutes=nap_duration)

                daily_activities.append({
                    "id": str(activity_id),
                    "type": "sleep",
                    "startTime": iso_z(nap_start),
                    "endTime": iso_z(nap_end)
                })
                activity_id += 1

        activities.extend(daily_activities)
        current_date += datetime.timedelta(days=1)

    # Sort activities by start time (newest first)
    activities.sort(key=lambda x: x["startTime"], reverse=True)

    export_data = {
        "exportDate": iso_z(now_utc),
        "appVersion": "1.0.0",
        "activities": activities
    }

    return export_data

# Generate and save the data
dummy_data = generate_dummy_data()

with open('mamalog-3-months-dummy-data.json', 'w', encoding='utf-8') as f:
    json.dump(dummy_data, f, indent=2, ensure_ascii=False)

print(f"Generated {len(dummy_data['activities'])} activities over ~3 months")
print("File saved as: mamalog-3-months-dummy-data.json")
