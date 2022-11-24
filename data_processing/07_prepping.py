"""
Apply all the pre-processing steps to the data and generate a new GTFS feed.
"""

from pathlib import Path

from gtfs_kit.feed import read_feed
import pandas as pd

print("Reading feed")
feed = read_feed("data/20221114_fahrplaene_gesamtdeutschland_gtfs.zip", "m")

# Remove faulty transfers
print("Faulty transfers")
df_faulty_transfers = pd.read_csv(
    "data/faulty_transfers.csv",
    dtype={"from_stop_id": str, "to_stop_id": str},
)

print("Before:", len(feed.transfers))

for row in df_faulty_transfers.itertuples():
    feed.transfers.drop(
        feed.transfers[
            (feed.transfers.from_stop_id == row.from_stop_id)
            & (feed.transfers.to_stop_id == row.to_stop_id)
        ].index,
        inplace=True,
    )

print("After:", len(feed.transfers))


# Add missing transfers
print("Missing transfers")
df_missing_transfers = pd.read_csv(
    "data/new_transfers.csv",
    dtype={"from_stop_id": str, "to_stop_id": str},
)
df_same_name_transfers = pd.read_csv(
    "data/new_transfers_same_name.csv",
    dtype={"from_stop_id": str, "to_stop_id": str},
)

print("Before:", len(feed.transfers))

df_concat_transfers = pd.concat(
    [
        feed.transfers,
        df_missing_transfers,
        df_same_name_transfers,
    ]
)
df_concat_transfers.drop_duplicates(subset=["from_stop_id", "to_stop_id"], inplace=True)
feed.transfers = df_concat_transfers

print("After:", len(feed.transfers))


# Blacklist stops
print("Blacklist")
df_blacklist = pd.read_csv(
    "data/blacklist_ids.txt",
    names=["stop_id"],
    header=0,
    dtype={"stop_id": str},
)

print("Stops before:", len(feed.stops))
print("Transfers before:", len(feed.transfers))
print("Stop times before:", len(feed.trips))

feed.stops.drop(
    feed.stops[feed.stops.stop_id.isin(df_blacklist.stop_id)].index,
    inplace=True,
)
feed.stop_times.drop(
    feed.stop_times[feed.stop_times.stop_id.isin(df_blacklist.stop_id)].index,
    inplace=True,
)
feed.transfers.drop(
    feed.transfers[feed.transfers.from_stop_id.isin(df_blacklist.stop_id)].index,
    inplace=True,
)
feed.transfers.drop(
    feed.transfers[feed.transfers.to_stop_id.isin(df_blacklist.stop_id)].index,
    inplace=True,
)

print("Stops after:", len(feed.stops))
print("Transfers after:", len(feed.transfers))
print("Stop times after:", len(feed.trips))

# Renames
print("Renames")
df_renames = pd.read_csv("data/rename.csv", dtype={"stop_id": str})

print("Before:", len(feed.stops["stop_name"].unique()))

for row in df_renames.itertuples():
    feed.stops.loc[feed.stops.stop_id == row.stop_id, ["stop_name"]] = row.new_name

print("After:", len(feed.stops["stop_name"].unique()))


# Save feed
feed.write(Path("data/20220829_preprocessed.zip"))
