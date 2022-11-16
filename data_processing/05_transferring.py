"""
Generate new transfers for stops within walking distance and approximate the time.
Stops with the same name are allowed a higher distance to be walkable.
"""


from concurrent.futures import ThreadPoolExecutor, wait
from pathlib import Path
from typing import Generator
from threading import Lock

from gtfs_kit.feed import read_feed
import geopandas as gp
import numpy as np
import pandas as pd


def load_feed():
    DATA_DIR = Path("data").absolute()
    gtfs_de = read_feed(DATA_DIR / "20220829_fahrplaene_gesamtdeutschland_gtfs.zip", "m")
    gtfs_de.stops["geometry"] = gp.points_from_xy(gtfs_de.stops.stop_lon, gtfs_de.stops.stop_lat)
    gdf_stops = gp.GeoDataFrame(gtfs_de.stops.copy(), geometry="geometry")
    gdf_stops.crs = "EPSG:4326"
    gdf_stops.to_crs("EPSG:25832", inplace=True)
    del gtfs_de
    return gdf_stops


def limit_to_germany(gdf_stops: gp.GeoDataFrame):
    gdf_germany = gp.read_file("data/germany.geojson")
    gdf_germany = gdf_germany.to_crs("EPSG:25832")
    gdf_stops = gdf_stops[gdf_stops.within(gdf_germany.unary_union.buffer(1000))]
    return gdf_stops


def get_nearby_stops(
    gdf_stops: gp.GeoDataFrame, row: pd.Series, radius: float = 500
) -> pd.DataFrame:
    stop_location = row.geometry  # gdf_stops[gdf_stops["stop_id"] == stop_id]["geometry"].values[0]
    copy_df = gdf_stops[["stop_id", "geometry"]].copy()
    copy_df["distance"] = gdf_stops.distance(stop_location)
    result_df = copy_df[(copy_df["distance"] < radius)][["stop_id", "distance"]].copy()
    del copy_df
    return result_df


def generate_transfers(gdf_stops: gp.GeoDataFrame, radius: float = 500, chunk_size: int = 50_000):
    dfs_transfers = []

    for chunk in chunked_stops(gdf_stops, width=chunk_size, overlap=radius * 2):
        chunk_size = len(chunk)
        if chunk_size == 0:
            print("\n\n Skipping empty chunk")
            continue
        print(f"\n\nProcessing chunk {chunk.total_bounds}...")
        dfs_transfers.extend(generate_for_chunk(chunk, radius))

    df_transfers = pd.concat(dfs_transfers)

    # Drop duplicates
    df_transfers.drop_duplicates(["from_stop_id", "to_stop_id"], inplace=True)

    # Reverse and append (only if shrinking)
    # df_transfers_reversed = df_transfers.copy()
    # df_transfers_reversed["from_stop_id"], df_transfers_reversed["to_stop_id"] = (
    #     df_transfers_reversed["to_stop_id"],
    #     df_transfers_reversed["from_stop_id"],
    # )
    # dfs_transfers.append(df_transfers_reversed)

    return df_transfers


def generate_for_chunk(chunk: pd.DataFrame, radius: float) -> Generator[pd.DataFrame, None, None]:
    chunk_size = len(chunk)
    # chunk_shrinking = chunk.copy()
    for i, row in enumerate(chunk.itertuples()):
        print(f"{i + 1}/{chunk_size}", end="\r")
        nearby_stops = get_nearby_stops(chunk, row, radius)
        if len(nearby_stops) == 0:
            continue

        nearby_stops["from_stop_id"] = row.stop_id
        nearby_stops["transfer_type"] = 2

        # Convert distance to walking time @ 1.11 m/s
        nearby_stops["distance"] /= 1.111111
        nearby_stops.rename(
            columns={
                "stop_id": "to_stop_id",
                "distance": "min_transfer_time",
            },
            inplace=True,
        )
        nearby_stops["min_transfer_time"] = np.ceil(nearby_stops["min_transfer_time"])
        nearby_stops.loc[nearby_stops["min_transfer_time"] < 120, ["min_transfer_time"]] = 120

        # Reorder columns
        nearby_stops = nearby_stops[
            [
                "from_stop_id",
                "to_stop_id",
                "transfer_type",
                "min_transfer_time",
            ]
        ]

        yield nearby_stops

        # Drop rows with same stop_id
        # chunk_shrinking = chunk_shrinking[chunk_shrinking["stop_id"] != row.stop_id]


def generate_transfers_to_same_name(gdf_stops: gp.GeoDataFrame):
    stop_names = gdf_stops["stop_name"].unique()
    executor = ThreadPoolExecutor(max_workers=32)
    extend_lock = Lock()

    futures = []
    dfs_transfers = []

    for stop_name in stop_names:

        def proc(stop_name):
            print(f"Processing {stop_name}")
            stops = gdf_stops[gdf_stops["stop_name"] == stop_name]
            if len(stops) == 1:
                return

            dfs = list(generate_for_chunk(stops, radius=1000))
            with extend_lock:
                dfs_transfers.extend(dfs)

        futures.append(executor.submit(proc, stop_name))

    wait(futures)

    executor.shutdown(wait=True)
    return pd.concat(dfs_transfers)


def chunked_stops(
    gdf_stops: gp.GeoDataFrame,
    width: float = 50_000,
    overlap: float = 1000,
) -> Generator[gp.GeoDataFrame, None, None]:
    minx, miny, maxx, maxy = gdf_stops.total_bounds
    x = minx - 1
    while x < maxx:
        y = miny - 1
        while y < maxy:
            yield gdf_stops.cx[x : x + width, y : y + width]
            y += width - overlap
        x += width - overlap


def main():
    print("Loading feed...")
    gdf_stops = load_feed()
    print("Limiting to Germany...")
    gdf_stops_de = limit_to_germany(gdf_stops)
    print("Generating transfers...")
    df_transfers = generate_transfers(gdf_stops_de, radius=250, chunk_size=25_000)
    print("Writing transfers...")
    df_transfers.to_csv("data/new_transfers.csv", index=False)

    print("Generating transfers to same name...")
    df_transfers_same_name = generate_transfers_to_same_name(gdf_stops)
    df_transfers_same_name.to_csv("data/new_transfers_same_name.csv", index=False)


if __name__ == "__main__":
    main()

# 51.430453
# 6.774528
