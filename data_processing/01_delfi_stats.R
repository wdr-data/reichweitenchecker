library(tidyverse)
library(lubridate)
library(sf)
library(geojsonsf)
library(dtplyr)
library(data.table)

# Blacklist und Rename laden
# 
# blacklist <- read_lines("data/blacklist_ids.txt")
# 
# rename <- read_csv("data/rename.csv")
# 
# rename_list = rename$new_name
# names(rename_list) <- rename$stop_id
# 
# ifelse("dea:05958:32194:0:2" %in% names(rename_list), rename_list[["de:05958:32194:0:2"]], "blabla")
# 
# #Ausprobieren für einen Tag
# stop_times_0912 <- fread("data/stop_times_0912.csv")
# 
# st_cor_0912 %>% filter(stop_id %in% blacklist) %>% select(stop_name, stop_id) %>% distinct()
# 
# st_cor_0912 <- as_tibble(stop_times_0912) %>% 
#   filter(!(stop_id %in% blacklist)) %>% 
#   rowwise %>% 
#   mutate(stop_name = ifelse(stop_id %in% names(rename_list), rename_list[[stop_id]], stop_name)) %>% 
#   as_tibble()
# 
# # Tägliche Werte berechnen
# daily_0912 <- lazy_dt(stop_times_0912) %>%
#  group_by(stop_name) %>%
#  summarize(earliest = min(dep_time),
#            latest = max(dep_time),
#            dep_per_day = n()) %>%
#  as_tibble()
# 
# # Stündliche Abfahrten berechnen
# hourly_0912 <- lazy_dt(stop_times_0912) %>%
#   group_by(stop_name, dep_hour) %>%
#   summarize(dep_per_hour = n()) %>%
#   as_tibble()
# 
# # Durchschnitt stündliche Abfahrten in der "Kernzeit" - nach 6 und vor 20 Uhr
# hourly_avg_0912 <- lazy_dt(hourly_0912) %>%
#   filter((dep_hour >= 6) & (dep_hour < 20)) %>%
#   group_by(stop_name) %>%
#   summarize(dep_per_hour_avg = sum(dep_per_hour) / 14) %>%
#   as_tibble()
# 
# 
# 
# #
# # routes = lazy_dt(stop_times_0912) %>%
# #   count(stop_name, route_type) %>%
# #   mutate(route_type_long = route_types[as.character(route_type)]) %>%
# #   pivot_wider(id_cols = "stop_name", names_from = "route_type_long", values_from = "n", names_prefix = "rt_") %>%
# #   as_tibble()
# # # Werte zusammenfassen
# stats_0912_long <- daily_0912 %>%
#   left_join(hourly_avg_0912, by = "stop_name") %>%
#   full_join(hourly_0912, by = "stop_name") %>%
#   mutate(weekday = "Montag")

# prepare list for each day
day_list <- c("0912", "0913", "0914", "0915", "0916", "0917", "0918")

# prepare "translation" for transportation types
# from: https://developers.google.com/transit/gtfs/reference#routestxt
# extended types from: https://developers.google.com/transit/gtfs/reference/extended-route-types
route_types = c(
  "1" = "U-Bahn", 
  "2" = "Bahn", 
  "3" = "Bus", 
  "100" = "Zug", # Railway Service
  "101" = "Hochgeschwindigkeitszug",
  "102" = "Fernzug",
  "103" = "InterRegio", # Inter Regional Rail Service
  "106" = "Regionalbahn",
  "109" = "S-Bahn",
  "400" = "U-Bahn", # Urban Railway Service
  "700" = "Sightseeing-Bus", # Sightseeing Bus
  "900" = "Tram", # Tram Service
  "1000" = "Wassertransport" # Water Transport Service
  )

# prepare function to switch to next day if departure is later than midnight
wd_po <- function(weekday){
  if(weekday == "Montag"){
    return("Dienstag")
  } else if(weekday == "Dienstag"){
    return("Mittwoch")
  } else if(weekday == "Mittwoch"){
    return("Donnerstag")
  } else if(weekday == "Donnerstag"){
    return("Freitag")
  } else if(weekday == "Freitag"){
    return("Samstag")
  } else if(weekday == "Samstag"){
    return("Sonntag")
  } else if(weekday == "Sonntag"){
    return("Montag")
  }
}

# load manual blacklist of broken stations
blacklist <- read_lines("data/blacklist_ids.txt")

# load list of stations to rename 
rename <- read_csv("data/rename.csv")

rename_list = rename$new_name
names(rename_list) <- rename$stop_id

rename_municipality <- rename %>% 
  select("stop_name" = "new_name", "municipality" = "new_municipality") %>% 
  distinct()

# evaluate each day and put everything in one long tibble

stats_long <- lapply(day_list, function(input_day){
  # load stop_times for current day
  input_data = fread(str_c("data/stop_times_", input_day, ".csv"))

  # filter or rename broken stops
  input_cor <- as_tibble(input_data) %>% 
    filter(!(stop_id %in% blacklist)) %>% 
    rowwise %>% 
    mutate(stop_name = ifelse(stop_id %in% names(rename_list), rename_list[[stop_id]], stop_name)) %>% 
    as_tibble()

  
  # Calculate departures per day
  daily <- lazy_dt(input_cor) %>% 
    group_by(stop_name) %>% 
    summarize(dep_per_day = n()) %>% 
    as_tibble()
  
  # Calculate departures per hour
  hourly <- lazy_dt(input_cor) %>% 
    group_by(stop_name, dep_hour) %>% 
    summarize(dep_per_hour = n()) %>% 
    as_tibble()
  

  # calculate average hourly departures for time from 6am to 8pm
  hourly_avg <- lazy_dt(hourly) %>% 
    filter((dep_hour >= 6) & (dep_hour < 20)) %>% 
    group_by(stop_name) %>% 
    summarize(dep_per_hour_avg = sum(dep_per_hour) / 14) %>% 
    as_tibble()
  
  # count type of transportation
  routes = lazy_dt(input_cor) %>% 
    count(stop_name, route_type) %>% 
    mutate(route_type_long = route_types[as.character(route_type)]) %>% 
    pivot_wider(id_cols = "stop_name", names_from = "route_type_long", values_from = "n", names_prefix = "rt_") %>% 
    as_tibble()
  
  # put it all together
  stats_long <- daily %>% 
    left_join(hourly_avg, by = "stop_name") %>% 
    left_join(routes, by="stop_name") %>% 
    full_join(hourly, by = "stop_name") %>% 
    mutate(weekday = input_day) %>% 
    relocate(stop_name, weekday)
  
  }) %>% bind_rows %>% 
  arrange(stop_name, weekday)

# Join statistics with station data/coords
stations_raw <- fread("data/stations_coords.csv")

stations_to_join <- lazy_dt(stations_raw) %>% 
  mutate(lat = str_extract(geometry, "\\|.*") %>% str_remove("\\|") %>% as.double(),
         lon = str_extract(geometry, ".*\\|") %>% str_remove("\\|") %>% as.double()) %>% 
  select(stop_name, lat, lon, "municipality" = "GEN", AGS) %>% 
  as_tibble() %>% 
  # attach renamed stops (at this time only name and municipality)
  bind_rows(rename_municipality)

stats_full_long <- stats_long %>% 
  left_join(stations_to_join) %>% 
  relocate(stop_name, municipality, AGS, lat, lon, weekday, 
           dep_per_day, dep_per_hour_avg, dep_hour, dep_per_hour) %>% 
  mutate(weekday = str_replace_all(weekday, c(
    "0912" = "Montag", "0913" = "Dienstag", "0914" = "Mittwoch",
    "0915" = "Donnerstag", "0916" = "Freitag",
    "0917" = "Samstag", "0918" = "Sonntag"
    )))
  
# fwrite(stats_full_long, "data/temp_stats_long.csv")

# correct departure times later than midnight
hours_corrected <- stats_full_long %>% 
  rowwise %>% 
  mutate(
    dep_hour_cor = ifelse(dep_hour > 23, dep_hour - 24, dep_hour),
    weekday_cor = ifelse(dep_hour > 23, wd_po(weekday), weekday)
  )

# calculate absolute departures for each hour of the day
hour_counts <- hours_corrected %>% 
  group_by(stop_name, weekday_cor, dep_hour_cor) %>% 
  summarize(dep_per_hour_cor = sum(dep_per_hour))

# fwrite(hour_counts, "data/temp_hour_counts.csv")

# Keep only data valid per station and day - get rid of wrong hour counts
stats_long_short <- stats_full_long %>% 
  select(-dep_hour, -dep_per_hour) %>% 
  distinct()

# prepare data for joining, so that every day has the basics even when there
# are no departures on a certain day
week_scheme <- stats_long_short %>% 
  select(stop_name, municipality, AGS, lat, lon) %>% 
  group_by(stop_name, municipality, AGS, lat, lon) %>% 
  summarize(weekday = c("Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"))

stats_long_short_week <- week_scheme %>% 
  left_join(stats_long_short, by=c("stop_name", "municipality", "AGS", "lat", "lon", "weekday"))

# Add corrected hour counts
stats_long_corrected <- hour_counts %>% 
  rename("weekday" = "weekday_cor") %>% 
  left_join(stats_long_short_week, by=c("stop_name", "weekday"))

# write long format data
fwrite(stats_long_corrected, "data/stats_long_corrected.csv")

# pivot to wide format (one line per station and day) 
stats_wide <- stats_long_corrected %>% 
  pivot_wider(id_cols = c(stop_name, municipality, AGS, lat, lon, 
                          weekday, dep_per_day, dep_per_hour_avg,
                          rt_Bahn, rt_Bus, rt_Fernzug, rt_Hochgeschwindigkeitszug,
                          rt_Regionalbahn, "rt_S-Bahn",
                          "rt_U-Bahn", rt_Zug, rt_InterRegio,
                          "rt_Sightseeing-Bus", rt_Tram, rt_Wassertransport),
              names_from = dep_hour_cor, values_from = dep_per_hour_cor,
              names_glue = "dep_count_{str_pad(dep_hour_cor, width=2, side='left', pad='0')}h") %>% 
  relocate(stop_name, municipality, AGS, lat, lon, 
           weekday, dep_per_day, dep_per_hour_avg, 
           sort(colnames(.)))

# write wide format
fwrite(stats_wide, "data/stats_wide.csv")
