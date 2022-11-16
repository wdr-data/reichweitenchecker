# Calculate travel times for all stops

# install.packages('tidyverse')
# install.packages('tidytransit')
# install.packages('sf')
# install.packages('geojsonsf')
# install.packages('jsonlite')
# install.packages('dtplyr')

library(tidyverse)
library(tidytransit)
library(parallel)
library(readr)
library(sf)
library(geojsonsf)


# Konstanten
args <- commandArgs(trailingOnly = TRUE)
DAY_NAME <- args[1]

if (DAY_NAME == "monday") {
  START_TIME <- 6 * 3600
  END_TIME <- 10 * 3600
  DAY <- "2022-09-12"
} else if (DAY_NAME == "saturday") {
  START_TIME <- 10 * 3600
  END_TIME <- 14 * 3600
  DAY <- "2022-09-17"
} else if (DAY_NAME == "sunday") {
  START_TIME <- 10 * 3600
  END_TIME <- 14 * 3600
  DAY <- "2022-09-18"
} else {
  print("Invalid day")
  quit()
}

MAX_TRAVEL_TIME <- 60 * 60


print("Reading GTFS...")

gtfs_de <- read_gtfs("data/20220829_preprocessed.zip", quiet = FALSE)


print("Generating stop names...")
# Geo-Daten NRW laden
geo_nrw <- st_read("data/gemeinden_geo.json")

# Stationen in SF umwandeln und dann nach NRW filtern
all_stops <-
  st_as_sf(gtfs_de$stops,
    coords = c("stop_lon", "stop_lat"),
    crs = 4326
  )

nrw_stops <- st_join(all_stops, geo_nrw, join = st_within, left = FALSE)
unique_stop_names <- unique(nrw_stops$stop_name)
rm(geo_nrw, all_stops, nrw_stops)

# Filter existing files
# existing_files <- list.files(sprintf("data/travel_times_%s", DAY_NAME), "*.csv", full.names = FALSE)
# existing_files <- gsub(".csv", "", existing_files)
# existing_files <- lapply(existing_files, URLdecode)
# unique_stop_names <- unique_stop_names[!(unique_stop_names %in% existing_files)]


print("Computing stop times...")
# Prepare optimized datastructure for RAPTOR
stop_times <-
  filter_stop_times(gtfs_de, DAY, START_TIME, END_TIME)

rm(gtfs_de)

# Cluster setup
gc()

print("Setting up cluster...")
no_cores <- 72 # detectCores() / 2
cl <- makeCluster(no_cores, type = "FORK")

print("Running...")
# Run all stops in cluster
failures <-
  parLapply(cl, unique_stop_names, function(stop_name) {
    tryCatch(
      {
        tt <-
          travel_times(
            stop_times,
            stop_name,
            stop_dist_check = FALSE,
            max_departure_time = END_TIME,
            return_coords = TRUE,
            max_transfers = 3
          )
        write.csv(
          tt[tt$travel_time <= MAX_TRAVEL_TIME, ],
          sprintf(
            "data/travel_times_%s/%s.csv",
            DAY_NAME,
            URLencode(stop_name, reserved = TRUE, repeated = TRUE)
          )
        )
      },
      error = function(e) {
        sprintf("%s errored: %s", stop_name, e)
      },
      warning = function(w) {
        sprintf("%s warned: %s", stop_name, w)
      }
    )
  })

stopCluster(cl)

failures_unlist <- unlist(failures)
write.csv(failures_unlist, sprintf("fails_%s.csv", DAY_NAME))
