"""
Merges the data from the three days plus the stop statistics into one file per stop.
"""


from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import quote

import ujson as json


DATA_DIR = Path("data")

file_stops = DATA_DIR / "stops.json"

dir_stats = Path("stop_stats_ranked")

dir_monday = DATA_DIR / "travel_times_proc_monday_combine"
dir_saturday = DATA_DIR / "travel_times_proc_saturday_combine"
dir_sunday = DATA_DIR / "travel_times_proc_sunday_combine"

target_path = DATA_DIR / "merged"
target_path.mkdir(exist_ok=True)

with open(file_stops, "r", encoding="utf-8") as f:
    stops = json.load(f)


def process_stop(stop_name):
    print(".", end="", flush=True)
    stop_name_enc = quote(stop_name, safe="")

    file_monday = dir_monday / f"{stop_name_enc}.json"
    file_saturday = dir_saturday / f"{stop_name_enc}.json"
    file_sunday = dir_sunday / f"{stop_name_enc}.json"
    file_stats = dir_stats / f"{stop_name_enc}.json"

    with open(file_monday, "r", encoding="utf-8") as f:
        monday = json.load(f)
    with open(file_saturday, "r", encoding="utf-8") as f:
        saturday = json.load(f)
    with open(file_sunday, "r", encoding="utf-8") as f:
        sunday = json.load(f)
    with open(file_stats, "r", encoding="utf-8") as f:
        stats = json.load(f)

    merged = {
        "travelTimes": {"Werktag": monday, "Samstag": saturday, "Sonntag": sunday},
        "stats": stats,
    }

    with open(target_path / f"{stop_name_enc}.json", "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False)


executor = ThreadPoolExecutor(max_workers=32)
futs = []
for stop_name, municipality in stops:
    futs.append(executor.submit(process_stop, stop_name))

for fut in futs:
    fut.result()

executor.shutdown(wait=True)
