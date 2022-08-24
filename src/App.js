import { MapContainer, TileLayer, Marker, CircleMarker, Popup } from 'react-leaflet'

import * as React from 'react'
import { useState, useCallback, useEffect, useMemo } from 'react'

import styles from './App.module.scss'
import VirtualizedAutocomplete from './VirtualizedAutocomplete'

function App () {
  const [travelStops, setTravelStops] = useState([])
  const travelStopNames = useMemo(() => Object.keys(travelStops), [travelStops])

  useEffect(() => {
    async function fetchTravelStops () {
      const response = await fetch(`${process.env.PUBLIC_URL}/travel_stops.json`)
      const data = await response.json()
      setTravelStops(data)
    }
    fetchTravelStops()
  }, [])

  const [map, setMap] = useState(null)
  //const [selectedStopName, setSelectedStopName] = useState('Köln Hansaring')
  const [selectedStop, setSelectedStop] = useState(null)

  const handleStopChange = useCallback(async (event, stop) => {
    //setSelectedStopName(stop)
    const stopData = await (
      await fetch(`${process.env.PUBLIC_URL}/travel_times_proc/${travelStops[stop]}.json`)
    ).json()
    map.setView(stopData['stop_info']['coord'], 11)
    setSelectedStop(stopData)
  }, [map, travelStops])

  const circleMarkers = useMemo(() => {
    if (!selectedStop) {
      return []
    }

    return selectedStop['destinations'].map(destination => (
      <CircleMarker
        key={`${destination["id"]}_${destination["time"]}`}
        center={destination['coord']}
        pathOptions={{
          color: '#333',
          fillColor: destination['col'],
          weight: 1.5,
          fillOpacity: 0.7
        }}
      >
        <Popup>
          <b>{destination["name"]}</b><br/>
          Erreichbar in {destination["time"] / 60} min<br/>
          Erfordert {destination["trans"]} mal Umsteigen
        </Popup>
      </CircleMarker>
    ))
  }, [selectedStop])

  return (
    <div className={styles.app}>
      <VirtualizedAutocomplete
        className={styles.searchField}
        options={travelStopNames}
        label={travelStopNames ? 'Haltestelle suchen' : 'Lade...'}
        onChange={handleStopChange}
        //defaultValue='Köln Hbf'
      />
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
