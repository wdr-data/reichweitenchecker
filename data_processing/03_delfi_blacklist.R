library(tidyverse)
library(tidytransit)
library(sf)

# Load Delfi GTFS data
delfi <- read_gtfs("data/20220829_fahrplaene_gesamtdeutschland_gtfs.zip",
                   files = c("agency", "calendar_dates", "calendar", "frequencies",
                             "routes", "shapes", "stop_times", "stops",
                             "transfers", "trips"),
                   quiet = FALSE)

# Load geodata for NRW municipalities
geo_nrw <- st_read("data/gemeinden_geo.json")

# Filter for NRW stations
all_stops <- st_as_sf(delfi$stops, coords=c("stop_lon", "stop_lat"), crs=4326)
nrw_stops = st_join(all_stops, geo_nrw, join=st_within, left=FALSE)

# Use cluster-function from tidytransit to find stop_ids that are more 
# than 1km apart from other ids from the same stop_name
clustered <- cluster_stops(delfi$stops %>% filter(stop_name %in% nrw_stops$stop_name),
                           group_col = "stop_name",
                           cluster_colname = "cluster",
                           max_dist = 1000
                           )

# keep only stations with outlier ids (when no outlier is present, the 
# station wont have numbered clusters, ergo no "[" in the cluster column)
clusters <- clustered %>%
  filter(str_detect(cluster, "\\["))

write_csv(clusters, "data/clusters_1000.csv")

# split big tibble by stop_name, write geojson for each stop for manual analysis
# via tools like geojson.io
split_clusters <- clusters %>% 
  group_by(stop_name) %>% 
  group_split(.keep=TRUE)

split_names <-  clusters$stop_name %>% unique

lapply(split_clusters, function(x){
  x_sf = st_as_sf(x, coords = c("stop_lon", "stop_lat"), crs=4326)
  x_file = paste0("data/split_1000/", str_remove_all(x[[1,3]], "\\s|\\/|\\-|\\(|\\)"), ".geojson")
  st_write(x_sf, x_file)
})

clusters_sf <- st_as_sf(clusters, coords = c("stop_lon", "stop_lat"), crs=4326)

# create blacklist of wrong stop_ids

# Filter stop_ids not in NRW
blacklist_nrw_raw <- st_join(clusters_sf, geo_nrw, join=st_within,left=TRUE)

# keep rest to analyse
keeplist_nrw <- blacklist_nrw_raw %>% 
  filter(!is.na(GN))
clusters_blacklist_raw <- clusters %>% 
  filter(stop_id %in% keeplist_nrw$stop_id)

# function for detection of outliers
# https://www.r-bloggers.com/2017/12/combined-outlier-detection-with-dplyr-and-ruler/
isnt_out_mad <- function(x, thres = 3, na.rm = TRUE) {
  abs(x - median(x, na.rm = na.rm)) <= thres * mad(x, na.rm = na.rm)
}

# calculate median coords for each stop_name
clusters_blacklist_med <- clusters_blacklist_raw %>% 
  group_by(stop_name) %>% 
  summarize(med_lat = median(stop_lat),
            med_lon = median(stop_lon)) %>% 
  ungroup()

# calculate distance of each coordinate to station median
blacklist_for_detection <- clusters_blacklist_raw %>% 
  left_join(clusters_blacklist_med, by="stop_name") %>% 
  mutate(dist_lat = abs(stop_lat - med_lat),
         dist_lon = abs(stop_lon - med_lon)) %>% 
  select(stop_name, stop_id, stop_lat, med_lat, dist_lat, stop_lon, med_lon, dist_lon) %>% 
  arrange(stop_name, desc(dist_lat))

# mark stop_ids with abnormal distance from median
blacklist_checker <- blacklist_for_detection %>% 
  filter(dist_lat >= 0.001) %>% 
  mutate(flag="CHECK")

# summary to see which stations need checking
blacklist_checklist <- blacklist_for_detection %>% 
  left_join(select(blacklist_checker, stop_id, flag), by="stop_id") %>% 
  count(stop_name, flag) %>% 
  pivot_wider(names_from = "flag", values_from = "n", id_cols = "stop_name") %>% 
  filter(!(is.na(CHECK)))

# after manual analysis: 
blacklist_manual <- c(
  "de:05334:1867:6:6",
  "de:05366:73753:2:22",
  "de:05970:10285:21",
  "de:05382:53615:2:22",
  "de:05382:53615:2:21",
  "de:05378:32433:2:21",
  "de:05766:3048:0:1",
  "de:05766:3048:0:2",
  "000009082602",
  "de:05566:13689::2",
  "de:05754:10386:0:2",
  "000000524601",
  "de:05774:9312:0:1_G"
  )

# combine manual blacklist inside NRW with stop_ids outside NRW
blacklist_complete <- c(blacklist_manual, blacklist_nrw$stop_id)

# from manual analysis: rename stations
blacklist_rename <- tribble(
  ~stop_id,~new_name, ~new_municipality,
  "de:05958:32194:0:2","Amecke Bruchhausen","Amecke",
  "de:05958:32194:0:1","Amecke Bruchhausen","Amecke",
  "de:05966:34411:1:1","Eichen (Drolshagen)","Drolshagen",
  "de:05966:34411:1:2","Eichen (Drolshagen)","Drolshagen",
  "de:05966:37489:1:1","Hespecke (Lennestadt)","Lennestadt",
  "de:05970:33621:1:2","Holzhausen (bei Burbach) Ort","Burbach",
  "de:05970:33621:1:1","Holzhausen (bei Burbach) Ort","Burbach",
  "de:05958:33287:0:2","Schwartmecke (Eslohe)","Eslohe"
  )

write_lines(blacklist_complete, "data/blacklist_ids.txt")
write_csv(blacklist_rename, "data/rename.csv")
