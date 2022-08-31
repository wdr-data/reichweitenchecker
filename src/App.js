import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  Popup
} from 'react-leaflet'

import * as React from 'react'
import { useState, useCallback, useEffect, useMemo } from 'react'
import Paper from '@mui/material/Paper'

import styles from './App.module.scss'
import VirtualizedAutocomplete from './VirtualizedAutocomplete'
import BarChart from './BarChart'

function App () {
  const [travelStops, setTravelStops] = useState([])
  const travelStopNames = useMemo(() => Object.keys(travelStops), [travelStops])

  useEffect(() => {
    async function fetchTravelStops () {
      const response = await fetch(
        `${process.env.PUBLIC_URL}/travel_stops.json`
      )
      const data = await response.json()
      setTravelStops(data)
    }
    fetchTravelStops()
  }, [])

  const [map, setMap] = useState(null)

  useEffect(() => {
    if (!map) {
      return
    }
    map.fitBounds([
      [50.3103, 5.8941],
      [52.5295, 9.4868]
    ])
  }, [map])

  const [selectedStop, setSelectedStop] = useState(null)

  const handleStopChange = useCallback(
    async (event, stop) => {
      const [responseTravelTimes, responseStopStats] = await Promise.all([
        fetch(
          `${process.env.PUBLIC_URL}/data/travel_times_proc/${travelStops[stop]}.json`
        ),
        fetch(
          `${process.env.PUBLIC_URL}/data/stop_stats/${travelStops[stop]}.json`
        )
      ])

      const [travelTimes, stopStats] = await Promise.all([
        responseTravelTimes.json(),
        responseStopStats.json()
      ])

      const stopData = {
        ...travelTimes,
        stats: stopStats
      }

      const destLat = stopData['destinations'].map(c => c['coord'][0])
      const destLng = stopData['destinations'].map(c => c['coord'][1])
      if (destLat.length > 0 && destLng.length > 0) {
        map.fitBounds([
          [Math.min(...destLat), Math.min(...destLng)],
          [Math.max(...destLat), Math.max(...destLng)]
        ])
      } else {
        map.setView(stopData['stop_info']['coord'], 13)
      }
      setSelectedStop(stopData)
    },
    [map, travelStops]
  )

  const circleMarkers = useMemo(() => {
    if (!selectedStop) {
      return []
    }

    return selectedStop['destinations'].map(destination => (
      <CircleMarker
        key={`${destination['id']}_${destination['time']}`}
        center={destination['coord']}
        pathOptions={{
          color: '#333',
          fillColor: destination['col'],
          weight: 1.5,
          fillOpacity: 0.7
        }}
      >
        <Popup>
          <b>{destination['name']}</b>
          <br />
          Erreichbar in {destination['time'] / 60} min
          <br />
          Erfordert {destination['trans']} mal Umsteigen
        </Popup>
      </CircleMarker>
    ))
  }, [selectedStop])

  const chartWeekday = useMemo(() => {
    if (!selectedStop) return null
    const data = [
      "Montag",
      "Dienstag",
      "Mittwoch",
      "Donnerstag",
      "Freitag",
      "Samstag",
      "Sonntag"
    ].map(
      (day) => ({ label: day, value: (selectedStop.stats['daily_departures'][day] || {})['count'] || 0 })
    )
    return <BarChart data={data} width={300} height={200} />
  }, [selectedStop])


  const chartHours = useMemo(() => {
    if (!selectedStop) return null
    const data = [...Array(28).keys()].map(
      (hour) => ({ label: hour, value: (selectedStop.stats['hourly_departures'][hour] || {})['count'] || 0 })
    )
    return <BarChart data={data} width={300} height={200} />
  }, [selectedStop])

  return (
    <div className={styles.app}>
      <Paper padding={10}>
        <VirtualizedAutocomplete
          className={styles.searchField}
          options={travelStopNames}
          label={travelStopNames ? 'Haltestelle suchen' : 'Lade...'}
          onChange={handleStopChange}
        />
        {chartWeekday}
        {chartHours}
      </Paper>
      <MapContainer
        ref={setMap}
        className={styles.mapContainer}
        scrollWheelZoom={true}
        touchZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {circleMarkers}

        {selectedStop && (
          <Marker position={selectedStop['stop_info']['coord']} />
        )}
      </MapContainer>
    </div>
  )
}

export default App
