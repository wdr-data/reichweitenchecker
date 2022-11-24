"""
Find faulty transfers that would allow travellers to walk more than 1000m between stops.
Usually these lead to very unrealistic routes.
"""


from pathlib import Path

from gtfs_kit.feed import read_feed, Feed
import geopandas as gp
import pandas as pd


def load_feed():
    DATA_DIR = Path("data").absolute()
    gtfs_de = read_feed(DATA_DIR / "20221114_fahrplaene_gesamtdeutschland_gtfs.zip", "m")
    gtfs_de.stops["geometry"] = gp.points_from_xy(gtfs_de.stops.stop_lon, gtfs_de.stops.stop_lat)
    gdf_stops = gp.GeoDataFrame(gtfs_de.stops.copy(), geometry="geometry")
    gdf_stops.crs = "EPSG:4326"
    gdf_stops.to_crs("EPSG:25832", inplace=True)

    return gtfs_de, gdf_stops


def merge_transfers_with_locations(gtfs_de: Feed, gdf_stops: gp.GeoDataFrame) -> pd.DataFrame:
    """Merge transfers with stop locations."""
    df_transfers = gtfs_de.transfers.copy()
    gdf_from = (
        gdf_stops[["stop_id", "geometry"]]
        .copy()
        .rename(columns={"geometry": "from_geometry", "stop_id": "from_stop_id"})
    )
    gdf_to = (
        gdf_stops[["stop_id", "geometry"]]
        .copy()
        .rename(columns={"geometry": "to_geometry", "stop_id": "to_stop_id"})
    )
    df_transfers = df_transfers.merge(gdf_from, on="from_stop_id", how="left").merge(
        gdf_to, on="to_stop_id", how="left"
    )
    return df_transfers


def calculate_distance(df_transfers: pd.DataFrame):
    """Get transfers with minimum distance."""
    df_transfers["distance"] = df_transfers.apply(
        lambda x: x.from_geometry.distance(x.to_geometry),
        axis=1,
    )


def main():
    print("Loading feed...")
    gtfs_de, gdf_stops = load_feed()
    print("Merging transfers with locations...")
    df_transfers = merge_transfers_with_locations(gtfs_de, gdf_stops)
    print("Calculate transfer distances...")
    calculate_distance(df_transfers)
    print("Writing faulty transfers...")
    df_transfers[df_transfers.distance > 1000][["from_stop_id", "to_stop_id"]].to_csv(
        "data/faulty_transfers.csv", index=False
    )


if __name__ == "__main__":
    main()
