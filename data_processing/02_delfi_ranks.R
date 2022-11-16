library(tidyverse)
library(data.table)

# read data and keep only necessary cols
data_wide <- fread("data/stats_wide.csv")
data_comparison <- data_wide %>% 
  select(stop_name, weekday, dep_per_day, dep_per_hour_avg, starts_with("rt")) %>% 
  as_tibble()

# summarize: Monday through Friday as working days, Saturday and Sunday separately
data_days <- data_comparison %>% 
  mutate(day = str_replace_all(weekday, c("Montag" = "Werktag",
                                          "Dienstag" = "Werktag",
                                          "Mittwoch" = "Werktag",
                                          "Donnerstag" = "Werktag",
                                          "Freitag" = "Werktag"))) %>% 
  group_by(stop_name, day) %>% 
  summarize(dep_per_day = mean(dep_per_day),
            dep_per_hour_avg = mean(dep_per_hour_avg),
            rt_Bahn = mean(rt_Bahn),
            rt_Bus = mean(rt_Bus),
            rt_Fernzug = mean(rt_Fernzug),
            rt_Fähre = mean(rt_Fähre),
            rt_Hochgeschwindigkeitszug = mean(rt_Hochgeschwindigkeitszug),
            "rt_Kabel-Straßenbahn" = mean(`rt_Kabel-Straßenbahn`),
            rt_Regionalbahn = mean(rt_Regionalbahn),
            "rt_S-Bahn" = mean(`rt_S-Bahn`),
            rt_Straßenbahn = mean(rt_Straßenbahn),
            "rt_U-Bahn" = mean(`rt_U-Bahn`)
            )

# create empty dataset for merging, contains one row per kind of day and station
# prevents missing rows if no summary data ist present
three_day <- data_comparison %>% 
  distinct(stop_name) %>% 
  group_by(stop_name) %>% 
  summarize(day = c("Werktag", "Samstag", "Sonntag"))

data_days_full <- left_join(three_day, data_days, by=c("stop_name", "day")) %>% 
  replace_na(
    list(
      "dep_per_day" = 0, 
      "dep_per_hour_avg" = 0,
      "rt_Bahn" = 0,
      "rt_Bus" = 0,
      "rt_Fernzug" = 0,
      "rt_Fähre" = 0,
      "rt_Hochgeschwindigkeitszug" = 0,
      "rt_Kabel-Straßenbahn" = 0,
      "rt_Regionalbahn" = 0,
      "rt_S-Bahn" = 0,
      "rt_Straßenbahn" = 0,
      "rt_U-Bahn" = 0
    )
  )

# calculate ranks as percentage (i.e. 30 % are better) via data.table::rank
# use ties.method = max if you want to know how many are better 
# could use ties.method = min if you wanted to know how many are worse 
# example:
# station, value,    rank with ties/max,   rank with ties/min
#       a,     2,                     1,                    1
#       b,     3,                     2,                    2
#       c,     5, 4 (2 of 6 are higher), 3 (2 of 6 are lower)
#       d,     5, 4 (2 of 6 are higher), 3 (2 of 6 are lower)
#       e,     8,                     5,                    5
#       f,    11,                     6,                    6

data_ranks <- data_days_full %>% 
  group_by(day) %>% 
  mutate(dep_per_day_worse = rank(dep_per_day, ties.method = "max")/length(dep_per_day),
         dep_per_day_better = 1 - rank(dep_per_day, ties.method = "max")/length(dep_per_day),
         dep_per_hour_avg_worse = rank(dep_per_hour_avg, ties.method = "max")/length(dep_per_hour_avg),
         dep_per_hour_avg_better = 1 - rank(dep_per_hour_avg, ties.method = "max")/length(dep_per_hour_avg))

fwrite(data_ranks, "data/data_ranks.csv") 

