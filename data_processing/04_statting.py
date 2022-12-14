"""
Ingest CSV data generated by R scripts and create a JSON file for each station
"""


from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import quote

import ujson as json
import pandas as pd


WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]

target_path = Path("data/stop_stats_ranked")
target_path.mkdir(exist_ok=True)


def main():
    df = pd.read_csv("data/stats_long_corrected.csv")

    df_stops = (
        df.groupby(by=["stop_name"], as_index=False)
        .aggregate(
            {
                "municipality": "first",
                "dep_per_hour_avg": "first",
            }
        )
        .sort_values(by=["dep_per_hour_avg"], ascending=False)
    )

    stops = list(zip(df_stops["stop_name"], df_stops["municipality"]))

    with open("data/stops.json", "w", encoding="utf-8") as f:
        json.dump(stops, f, ensure_ascii=False)

    df_ranks = pd.read_csv("data/data_ranks.csv")

    executor = ThreadPoolExecutor(max_workers=32)

    futs = []

    for stop_name in df["stop_name"].unique():
        fut = executor.submit(
            process_stop,
            stop_name,
            df[df["stop_name"] == stop_name].copy(),
            df_ranks[df_ranks["stop_name"] == stop_name].copy(),
        )
        futs.append(fut)

    for fut in futs:
        fut.result()

    print("Done")


def process_stop(stop_name: str, df: pd.DataFrame, df_ranks: pd.DataFrame):

    if len(df[df["municipality"].isna()]) > 0:
        print(f"Stop {stop_name} has missing municipality!")
        df = df[df["municipality"].notna()]

    rt_cols = [
        "rt_Bahn",
        "rt_Bus",
        "rt_Fernzug",
        "rt_Fähre",
        "rt_Hochgeschwindigkeitszug",
        "rt_Kabel-Straßenbahn",
        "rt_Regionalbahn",
        "rt_S-Bahn",
        "rt_Straßenbahn",
        "rt_U-Bahn",
    ]

    df_group_by_day = df.groupby(by=["weekday"], as_index=False).aggregate(
        {
            "dep_per_day": "first",
            **{col: "first" for col in rt_cols},
        }
    )

    heatmap = {}

    for weekday in WEEKDAYS:
        df_deps = df[df["weekday"] == weekday]

        heatmap[weekday] = [
            int(df_deps[df_deps["dep_hour_cor"] == bucket]["dep_per_hour_cor"].sum())
            for bucket in range(24)
        ]

    # sum up departures per route type
    route_types_total = {}

    for rt_col in rt_cols:
        rt_sum = df_group_by_day[rt_col].sum()
        if rt_sum > 0:
            route_types_total[rt_col[3:]] = int(rt_sum)

    route_types_by_day = {}
    for day in ["Werktag", "Samstag", "Sonntag"]:
        route_types_by_day[day] = {}
        df_day = df_ranks[df_ranks["day"] == day]
        for rt_col in rt_cols:
            rt_sum = df_day[rt_col].sum()
            if rt_sum > 0:
                route_types_by_day[day][rt_col[3:]] = int(rt_sum)

    # ranking data
    rank_data = {
        row.day: {
            "dep_per_day": row.dep_per_day,
            "dep_per_hour_avg": row.dep_per_hour_avg,
            "dep_per_day_worse": row.dep_per_day_worse,
            "dep_per_day_better": row.dep_per_day_better,
            "dep_per_hour_avg_worse": row.dep_per_hour_avg_worse,
            "dep_per_hour_avg_better": row.dep_per_hour_avg_better,
        }
        for row in df_ranks.itertuples()
    }

    # Build final JSON
    station_data = {
        "stop_name": stop_name,
        "municipality": df["municipality"].values[0] if len(df) > 0 else "Unbekannt",
        "heatmap": heatmap,
        "route_types": route_types_total,
        "route_types_by_day": route_types_by_day,
        "rank_data": rank_data,
    }

    with open(target_path / f"{quote(stop_name, safe='')}.json", "w", encoding="utf-8") as f:
        json.dump(station_data, f, ensure_ascii=False)


if __name__ == "__main__":
    main()
