# Data processing pipeline

This directory contains a collection of scripts that are used to process the data for the map widget.

These scripts are here to document the process and to make it easier to reproduce the data, but there is no guarantee that they will work out of the box.

## Data sources

A GeoJSON file for NRW is provided, the original source is the [Federal Agency for Cartography and Geodesy](https://gdz.bkg.bund.de/index.php/default/digitale-geodaten/verwaltungsgebiete/verwaltungsgebiete-1-250-000-stand-01-01-vg250-01-01.html).

Additionally, you need to download GTFS feed for Germany provided by DELFI. The feed is available at [opendata-oepnv.de](https://www.opendata-oepnv.de/ht/de/organisation/delfi/startseite?tx_vrrkit_view%5Bdataset_name%5D=deutschlandweite-sollfahrplandaten-gtfs&tx_vrrkit_view%5Baction%5D=details&tx_vrrkit_view%5Bcontroller%5D=View). The feed is updated weekly. The original publication used the feed from 2022-08-29. This file is not included in the repository, but you can download it [here](https://prod.scrapers.data.wdr.de/reichweitenchecker/20220829_fahrplaene_gesamtdeutschland_gtfs.zip).
