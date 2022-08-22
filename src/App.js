import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

import * as React from 'react'
import { useState, useCallback } from 'react'

import styles from './App.module.scss'
import VirtualizedAutocomplete from './VirtualizedAutocomplete'
const OPTIONS = ['Chicago', 'New York', 'San Francisco', 'Cologne'].sort()

const COORDINATES = {
  Chicago: [41.8781, -87.6298],
  'New York': [40.7128, -74.0059],
  'San Francisco': [37.7749, -122.4194],
  Cologne: [50.9375, 6.96027]
}

function App () {
  const [map, setMap] = useState(null)
  const [selectedStop, setSelectedStop] = useState('Cologne')

  const handleStopChange = useCallback(
    (event, stop) => {
      setSelectedStop(stop);
      map.setView(COORDINATES[stop], 10)
    },
    [setSelectedStop, map]
  );

  return (
    <div className={styles.App}>
      <VirtualizedAutocomplete
        options={OPTIONS}
        label='Haltestelle'
        onChange={handleStopChange}
        defaultValue="Cologne"
      />
      <MapContainer
        ref={setMap}
        className={styles.MapContainer}
        center={COORDINATES[selectedStop]}
        zoom={10}
        scrollWheelZoom={true}
        touchZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        {selectedStop && (
          <Marker position={COORDINATES[selectedStop]} />
        )}
      </MapContainer>
    </div>
  )
}

export default App
