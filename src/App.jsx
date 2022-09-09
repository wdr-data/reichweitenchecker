import * as React from 'react'
import { useState, useCallback, useEffect, useMemo } from 'react'

import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  Popup
} from 'react-leaflet'
import {Icon, Point} from 'leaflet';
import { useElementSize } from 'usehooks-ts'
import clsx from 'clsx'

import styles from './App.module.scss'
import VirtualizedAutocomplete from './VirtualizedAutocomplete'
import HeatMap from './HeatMap'
import {colorMapMain, colorMapAlt} from './colorMap'

import customMarkerImg from './img/haltestelle_marker.svg'

const customMarker = new Icon({
  iconUrl: customMarkerImg,
  iconRetinaUrl: customMarkerImg,
  iconAnchor: new Point(17, 50),
  popupAnchor: null,
  shadowUrl: null,
  shadowSize: null,
  shadowAnchor: null,
  iconSize: new Point(34, 50),
});

const WEEKDAYS = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag'
]

const colorMapRouteTypes = {
  "Kabel-Straßenbahn": "#a6cee3",
  "Straßenbahn": "#1f78b4",
  "S-Bahn": "#b2df8a",
  "U-Bahn": "#33a02c",
  "Bahn": "#fb9a99",
  "Regionalbahn": "#e31a1c",
  "Fernzug": "#fdbf6f",
  "Hochgeschwindigkeitszug": "#ff7f00",
  "Fähre": "#cab2d6",
  "Bus": "#6a3d9a",
}

function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function encodeFileName(fileName) {
  return encodeURIComponent(
    encodeURIComponent(
      fixedEncodeURIComponent(fileName)
    )
  )
}


function App () {
  const [travelStops, setTravelStops] = useState([])
  const [map, setMap] = useState(null)
  const [selectedStop, setSelectedStop] = useState(null)

  // Load travel stops on page load
  useEffect(() => {
    async function fetchTravelStops () {
      const response = await fetch(
        `${process.env.REACT_APP_DATA_URL}/travel_stops.json`
      )
      const data = await response.json()
      setTravelStops(data)
    }
    fetchTravelStops()
  }, [])

  // Set initial map view
  useEffect(() => {
    if (!map) {
      return
    }
    map.fitBounds([
      [50.3103, 5.8941],
      [52.5295, 9.4868]
    ])
  }, [map])

  // Load stop data on selection
  const handleStopChange = useCallback(
    async (event, stop) => {
      if (!stop) {
        return
      }
      const stopURLEncoded = encodeFileName(stop)
      const [responseTravelTimes, responseStopStats] = await Promise.all([
        fetch(
          `${process.env.REACT_APP_DATA_URL}/travel_times_proc/${stopURLEncoded}.json`
        ),
        fetch(
          `${process.env.REACT_APP_DATA_URL}/stop_stats/${stopURLEncoded}.json`
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
      stopData['destinations'].reverse() // Closest last, so markers are on top

      const destLat = stopData['destinations'].map(c => c['coord'][0])
      const destLng = stopData['destinations'].map(c => c['coord'][1])
      window.setTimeout(() => {
        map.invalidateSize()
        if (destLat.length > 0 && destLng.length > 0) {
          map.fitBounds([
            [Math.min(...destLat), Math.min(...destLng)],
            [Math.max(...destLat), Math.max(...destLng)]
          ])
        } else {
          map.setView(stopData['stop_info']['coord'], 13)
        }
      }, 100)
      setSelectedStop(stopData)
    },
    [map]
  )

  // Build circle markers for each destination
  const circleMarkers = useMemo(() => {
    if (!selectedStop) {
      return []
    }

    return selectedStop['destinations'].map(destination => (
      <CircleMarker
        key={`${destination['id']}_${destination['time']}`}
        center={destination['coord']}
        pathOptions={{
          color: '#000',
          fillColor: colorMapMain(destination['time'] / 3600),
          //fillColor: colorMapMain(Math.min(destination['trans'], 3) / 3),
          weight: 0.2, // 1.5,
          fillOpacity: 0.9
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

  const [
    chartsRef,
    { width: chartsWidth, height: chartsHeight }
  ] = useElementSize()

  const heatmap = useMemo(() => {
    if (!selectedStop) return null
    return (
      <HeatMap
        className={styles.heatmap}
        width={chartsWidth}
        height={250}
        data={selectedStop.stats['heatmap']}
      />
    )
  }, [selectedStop, chartsWidth])

  const routeTypes = useMemo(() => {
    if (!selectedStop) return null

    const routeTypes = selectedStop.stats['vehicle_types']  // TODO: rename to route_types
    const total = Object.values(routeTypes).reduce((a, b) => a + b, 0)
    const routeTypePercentages = Object.entries(routeTypes).map(([key, value]) => ({
      type: key,
      percentage: value / total * 100,
    })).sort((a, b) => b.percentage - a.percentage)

    return (
      <div className={styles.routeTypes}>
        <div className={styles.routeTypesBar}>
          {routeTypePercentages.map(({ type, percentage }) => (
            <div
              key={type}
              className={styles.routeType}
              style={{
                width: `${percentage}%`,
                backgroundColor: colorMapRouteTypes[type],
              }}
            />
          ))}
        </div>
        <div className={styles.routeTypesLegend}>
          {routeTypePercentages.map(({ type, percentage }) => (
            <div key={type} className={styles.routeTypesLegendItem}>
              <div
                className={styles.routeTypeLegendColor}
                style={{ backgroundColor: colorMapRouteTypes[type] }}
              />
              <div className={styles.routeTypeLegendLabel}>
                {type} ({percentage.toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }, [selectedStop]);

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <a href='https://wdr.de/'>
          <img
            src={`${process.env.PUBLIC_URL}/wdr_logo.svg`}
            alt='WDR Logo'
            className={styles.logo}
          />
        </a>
      </div>
      <div className={styles.content}>
        <div className={styles.stopInfo}>
          <VirtualizedAutocomplete
            className={clsx(
              styles.searchField,
              !selectedStop && styles.searchFieldInitial
            )}
            options={travelStops}
            onChange={handleStopChange}
            blurOnSelect={true}
            loading={!travelStops}
            label='Haltestelle suchen'
            loadingText="Wird geladen..."
            noOptionsText="Keine Ergebnisse"
            clearText="Leeren"
            closeText="Schließen"
            openText="Öffnen"
          />
          <div className={styles.charts} ref={chartsRef}>
            {heatmap}
            {routeTypes}
          </div>
        </div>
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
            <Marker icon={customMarker} position={selectedStop['stop_info']['coord']} />
          )}
        </MapContainer>
      </div>
      <div className={styles.footer}>
        <span>&copy; WDR 2022</span>&nbsp;|&nbsp;
        <span>Impressum</span>&nbsp;|&nbsp;
        <span>Datenschutz</span>
      </div>
    </div>
  )
}

export default App
