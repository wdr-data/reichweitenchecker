library(tidyverse)
library(tidytransit)
library(lubridate)
library(sf)
library(geojsonsf)

# Read GTFS data from DELFI
# DELFI-Daten laden
delfi <- read_gtfs("data/20221114_fahrplaene_gesamtdeutschland_gtfs.zip", 
                   files = c("agency", "calendar_dates", "calendar", "frequencies",
                             "routes", "shapes", "stop_times", "stops",
                             "transfers", "trips"),
                   quiet = FALSE)


# Load dtplyr after read_gtfs - crashes otherwise
library(dtplyr)
library(data.table)

# geo data for NRW
geo_nrw <- st_read("data/gemeinden_be_bb_geo.json")

# filter stations in NRW: convert to sf and join
all_stops <- st_as_sf(delfi$stops, coords=c("stop_lon", "stop_lat"), crs=4326)
nrw_stops = st_join(all_stops, geo_nrw, join=st_within, left=FALSE)

# Check no of stations
nrw_stops$stop_name %>% unique %>% length()

# create and save tibble with one row per station + coords
stations_coords <- nrw_stops %>% 
  lazy_dt() %>% 
  # prefer parent-stations, as their coords are probably centered
  # sort parents first, as distinct keeps first line
  mutate(is_parent = ifelse(location_type == 1, 1, 2)) %>% 
  arrange(is_parent) %>% 
  distinct(stop_name, .keep_all = TRUE) %>% 
  as_tibble()

fwrite(stations_coords, "data/stations_coords.csv")

#### Calculate stop_times for each day to analyze ----

# what trips are in service on day in question?
# Combine regular trips from calendar, add special trips that are added 
# via calendar_dates (exception_type = 1), remove trips that 
# are cancelled for the date in question via calendar_dates (exception_type = 2)

service_0912 <- full_join(
  delfi$calendar %>% filter(monday == 1),
  delfi$calendar_dates %>% filter(date == "2022-11-14"),
  by = "service_id"
  ) %>% 
  replace_na(replace=list(exception_type=0)) %>% 
  filter(exception_type != 2)

service_0913 <- full_join(
  delfi$calendar %>% filter(tuesday == 1),
  delfi$calendar_dates %>% filter(date == "2022-11-15"),
  by = "service_id"
  ) %>% 
  replace_na(replace=list(exception_type=0)) %>% 
  filter(exception_type != 2)

service_0914 <- full_join(
  delfi$calendar %>% filter(wednesday == 1),
  delfi$calendar_dates %>% filter(date == "2022-11-16"),
  by = "service_id"
  ) %>% 
  replace_na(replace=list(exception_type=0)) %>% 
  filter(exception_type != 2)

service_0915 <- full_join(
  delfi$calendar %>% filter(thursday == 1),
  delfi$calendar_dates %>% filter(date == "2022-11-17"),
  by = "service_id"
  ) %>% 
  replace_na(replace=list(exception_type=0)) %>% 
  filter(exception_type != 2)

service_0916 <- full_join(
  delfi$calendar %>% filter(friday == 1),
  delfi$calendar_dates %>% filter(date == "2022-11-18"),
  by = "service_id"
) %>% 
  replace_na(replace=list(exception_type=0)) %>% 
  filter(exception_type != 2)

service_0917 <- full_join(
  delfi$calendar %>% filter(saturday == 1),
  delfi$calendar_dates %>% filter(date == "2022-11-19"),
  by = "service_id"
) %>% 
  replace_na(replace=list(exception_type=0)) %>% 
  filter(exception_type != 2)

service_0918 <- full_join(
  delfi$calendar %>% filter(sunday == 1),
  delfi$calendar_dates %>% filter(date == "2022-11-20"),
  by = "service_id"
) %>% 
  replace_na(replace=list(exception_type=0)) %>% 
  filter(exception_type != 2)


# extract trips corresponding to service ids
trips_0912 <- delfi$trips %>% filter(service_id %in% service_0912$service_id)
trips_0913 <- delfi$trips %>% filter(service_id %in% service_0913$service_id)
trips_0914 <- delfi$trips %>% filter(service_id %in% service_0914$service_id)
trips_0915 <- delfi$trips %>% filter(service_id %in% service_0915$service_id)
trips_0916 <- delfi$trips %>% filter(service_id %in% service_0916$service_id)
trips_0917 <- delfi$trips %>% filter(service_id %in% service_0917$service_id)
trips_0918 <- delfi$trips %>% filter(service_id %in% service_0918$service_id)


# extract routes corresponding to trips
routes_0912 <- left_join(
  select(trips_0912, trip_id, route_id),
  delfi$routes,
  by = "route_id"
  )
routes_0913 <- left_join(
  select(trips_0913, trip_id, route_id),
  delfi$routes,
  by = "route_id"
  )
routes_0914 <- left_join(
  select(trips_0914, trip_id, route_id),
  delfi$routes,
  by = "route_id"
  )
routes_0915 <- left_join(
  select(trips_0915, trip_id, route_id),
  delfi$routes,
  by = "route_id"
  )
routes_0916 <- left_join(
  select(trips_0916, trip_id, route_id),
  delfi$routes,
  by = "route_id"
  )
routes_0917 <- left_join(
  select(trips_0917, trip_id, route_id),
  delfi$routes,
  by = "route_id"
  )
routes_0918 <- left_join(
  select(trips_0918, trip_id, route_id),
  delfi$routes,
  by = "route_id"
  )

# Extract departure times from stop_times-table, add date and time

stop_times_dt <- lazy_dt(delfi$stop_times)

stop_times_0912 <- stop_times_dt %>% 
  # keep only stations in NRW
  right_join(select(nrw_stops, stop_id, stop_name), by="stop_id") %>% 
  # keep only stop_times that occur in trips on said day
  filter(trip_id %in% trips_0912$trip_id) %>% 
  # format departure times
  mutate(
    dep_hour = str_extract(departure_time, "^\\d\\d") %>% as.integer,
    dep_mins = str_extract(departure_time, "^\\d\\d:\\d\\d") %>% str_remove("^\\d\\d:") %>% as.integer,
    dep_time = make_datetime(
      year = 2022, month = 9, min = dep_mins,
      # if dep_time is larger than 23, i.e. after midnight, 
      # switch to next day and subtract 24 from dep_hour
      day = ifelse(dep_hour > 23, 13, 12), 
      hour = ifelse(dep_hour > 23, dep_hour-24, dep_hour)
    )
  ) %>% 
  as_tibble()

stop_times_0913 <- stop_times_dt %>% 
  right_join(select(nrw_stops, stop_id, stop_name), by="stop_id") %>% 
  filter(trip_id %in% trips_0913$trip_id) %>% 
  mutate(
    dep_hour = str_extract(departure_time, "^\\d\\d") %>% as.integer,
    dep_mins = str_extract(departure_time, "^\\d\\d:\\d\\d") %>% str_remove("^\\d\\d:") %>% as.integer,
    dep_time = make_datetime(
      year = 2022, month = 9, min = dep_mins,
      # if dep_time is larger than 23, i.e. after midnight, 
      # switch to next day and subtract 24 from dep_hour
      day = ifelse(dep_hour > 23, 14, 13), 
      hour = ifelse(dep_hour > 23, dep_hour-24, dep_hour)
    )
  ) %>% 
  as_tibble()

stop_times_0914 <- stop_times_dt %>% 
  right_join(select(nrw_stops, stop_id, stop_name), by="stop_id") %>% 
  filter(trip_id %in% trips_0914$trip_id) %>% 
  mutate(
    dep_hour = str_extract(departure_time, "^\\d\\d") %>% as.integer,
    dep_mins = str_extract(departure_time, "^\\d\\d:\\d\\d") %>% str_remove("^\\d\\d:") %>% as.integer,
    dep_time = make_datetime(
      year = 2022, month = 9, min = dep_mins,
      # if dep_time is larger than 23, i.e. after midnight, 
      # switch to next day and subtract 24 from dep_hour
      day = ifelse(dep_hour > 23, 15, 14), 
      hour = ifelse(dep_hour > 23, dep_hour-24, dep_hour)
    )
  ) %>% 
  as_tibble()

stop_times_0915 <- stop_times_dt %>% 
  right_join(select(nrw_stops, stop_id, stop_name), by="stop_id") %>% 
  filter(trip_id %in% trips_0915$trip_id) %>% 
  mutate(
    dep_hour = str_extract(departure_time, "^\\d\\d") %>% as.integer,
    dep_mins = str_extract(departure_time, "^\\d\\d:\\d\\d") %>% str_remove("^\\d\\d:") %>% as.integer,
    dep_time = make_datetime(
      year = 2022, month = 9, min = dep_mins,
      # if dep_time is larger than 23, i.e. after midnight, 
      # switch to next day and subtract 24 from dep_hour
      day = ifelse(dep_hour > 23, 16, 15), 
      hour = ifelse(dep_hour > 23, dep_hour-24, dep_hour)
    )
  ) %>% 
  as_tibble()

stop_times_0916 <- stop_times_dt %>% 
  right_join(select(nrw_stops, stop_id, stop_name), by="stop_id") %>% 
  filter(trip_id %in% trips_0916$trip_id) %>% 
  mutate(
    dep_hour = str_extract(departure_time, "^\\d\\d") %>% as.integer,
    dep_mins = str_extract(departure_time, "^\\d\\d:\\d\\d") %>% str_remove("^\\d\\d:") %>% as.integer,
    dep_time = make_datetime(
      year = 2022, month = 9, min = dep_mins,
      # if dep_time is larger than 23, i.e. after midnight, 
      # switch to next day and subtract 24 from dep_hour
      day = ifelse(dep_hour > 23, 17, 16), 
      hour = ifelse(dep_hour > 23, dep_hour-24, dep_hour)
    )
  ) %>% 
  as_tibble()

stop_times_0917 <- stop_times_dt %>% 
  right_join(select(nrw_stops, stop_id, stop_name), by="stop_id") %>% 
  filter(trip_id %in% trips_0917$trip_id) %>% 
  mutate(
    dep_hour = str_extract(departure_time, "^\\d\\d") %>% as.integer,
    dep_mins = str_extract(departure_time, "^\\d\\d:\\d\\d") %>% str_remove("^\\d\\d:") %>% as.integer,
    dep_time = make_datetime(
      year = 2022, month = 9, min = dep_mins,
      # if dep_time is larger than 23, i.e. after midnight, 
      # switch to next day and subtract 24 from dep_hour
      day = ifelse(dep_hour > 23, 18, 17), 
      hour = ifelse(dep_hour > 23, dep_hour-24, dep_hour)
    )
  ) %>% 
  as_tibble()

stop_times_0918 <- stop_times_dt %>% 
  right_join(select(nrw_stops, stop_id, stop_name), by="stop_id") %>% 
  filter(trip_id %in% trips_0918$trip_id) %>% 
  mutate(
    dep_hour = str_extract(departure_time, "^\\d\\d") %>% as.integer,
    dep_mins = str_extract(departure_time, "^\\d\\d:\\d\\d") %>% str_remove("^\\d\\d:") %>% as.integer,
    dep_time = make_datetime(
      year = 2022, month = 9, min = dep_mins,
      # if dep_time is larger than 23, i.e. after midnight, 
      # switch to next day and subtract 24 from dep_hour
      day = ifelse(dep_hour > 23, 19, 18), 
      hour = ifelse(dep_hour > 23, dep_hour-24, dep_hour)
    )
  ) %>% 
  as_tibble()


# join with data for corresponding routes, e.g. type of transportation

stop_times_routes_0912 <- left_join(stop_times_0912, routes_0912, by="trip_id")
stop_times_routes_0913 <- left_join(stop_times_0913, routes_0913, by="trip_id")
stop_times_routes_0914 <- left_join(stop_times_0914, routes_0914, by="trip_id")
stop_times_routes_0915 <- left_join(stop_times_0915, routes_0915, by="trip_id")
stop_times_routes_0916 <- left_join(stop_times_0916, routes_0916, by="trip_id")
stop_times_routes_0917 <- left_join(stop_times_0917, routes_0917, by="trip_id")
stop_times_routes_0918 <- left_join(stop_times_0918, routes_0918, by="trip_id")


# write CSVs

fwrite(stop_times_routes_0912, "data/stop_times_0912.csv")
fwrite(stop_times_routes_0913, "data/stop_times_0913.csv")
fwrite(stop_times_routes_0914, "data/stop_times_0914.csv")
fwrite(stop_times_routes_0915, "data/stop_times_0915.csv")
fwrite(stop_times_routes_0916, "data/stop_times_0916.csv")
fwrite(stop_times_routes_0917, "data/stop_times_0917.csv")
fwrite(stop_times_routes_0918, "data/stop_times_0918.csv")
