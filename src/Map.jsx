import React, { useRef, useEffect, useState, useMemo } from 'react'
import Switch from '@mui/material/Switch'
import Stack from '@mui/material/Stack'

// eslint-disable-next-line import/no-webpack-loader-syntax
import maplibregl from '!maplibre-gl' // ! is important here
import maplibreglWorker from 'maplibre-gl/dist/maplibre-gl-csp-worker'

import { colorMapAlt, colorMapMain } from './colorMap'

import styles from './Map.module.scss'
import 'maplibre-gl/dist/maplibre-gl.css'

import customMarkerImg from './img/haltestelle_marker.svg'
import { format } from './util'

maplibregl.workerClass = maplibreglWorker

const bounds = [
  [4.21, 48.51],
  [11.77, 53.44]
]

export default function Map ({ selectedStop, day, ...props }) {
  const mapContainer = useRef(null)
  const map = useRef(null)

  const dayRef = React.useRef(day)

  useEffect(() => {
    dayRef.current = day
  }, [day])

  const [mapShowTransfers, setMapShowTransfers] = useState(true)

  useEffect(() => {
    if (map.current) return //stops map from intializing more than once
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `${process.env.PUBLIC_URL}/style-custom.json`,
      center: [7.99, 51.431],
      zoom: 8,
      maxBounds: bounds,
      dragRotate: false,
      touchPitch: false
    })
    map.current.touchZoomRotate.disableRotation()
    map.current.fitBounds([
      [5.8941, 50.3103],
      [9.4868, 52.5295]
    ])
    map.current.addControl(
      new maplibregl.NavigationControl({
        showCompass: false,
        visualizePitch: false
      }),
      'bottom-left'
    )

    map.current.on('zoom', () => {
      console.log(map.current.getZoom())
    })

    return () => {
      map.current.remove()
      map.current = undefined
    }
  }, [])

  // Popups for destinations
  useEffect(() => {
    if (!map.current) return
    // When a click event occurs on a feature in the places layer, open a popup at the
    // location of the feature, with description HTML from its properties.
    map.current.on('click', 'destinations', function (e) {
      var coordinates = e.features[0].geometry.coordinates.slice()
      var description = e.features[0].properties.description

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
      }

      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map.current)
    })

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.current.on('mouseenter', 'destinations', function () {
      map.current.getCanvas().style.cursor = 'pointer'
    })

    // Change it back to a pointer when it leaves.
    map.current.on('mouseleave', 'destinations', function () {
      map.current.getCanvas().style.cursor = ''
    })
  }, [map])

  // Marker
  useEffect(() => {
    if (!map.current || !selectedStop.available) return // wait for map to initialize

    const markerSvg = document.createElement('img')
    markerSvg.src = customMarkerImg
    markerSvg.width = 34
    markerSvg.height = 50

    const markerLocation =
      selectedStop.stop.travelTimes[day]['stop_info']['coord']
    const marker = new maplibregl.Marker({
      anchor: 'bottom',
      element: markerSvg
    }).setLngLat([markerLocation[1], markerLocation[0]])
    marker.addTo(map.current)
    return () => marker.remove()
  }, [map, selectedStop, day])

  // Destinations
  useEffect(() => {
    if (!map.current || !selectedStop.available) return // wait for map to initialize

    const destinations = selectedStop.stop.travelTimes[day].destinations.filter(
      d => mapShowTransfers || d.trans === 0
    )

    const geojsonData = {
      type: 'FeatureCollection',
      features: destinations.map(destination => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [destination.coord[1], destination.coord[0]]
        },
        properties: {
          color: colorMapAlt(destination.trans === 0 ? 1 : 0.33),
          name: destination.name,
          transfers: destination.trans,
          time: -1 * destination.time,
          description: `<b>${destination['name']}</b>
          <br />
          Erreichbar in ${format((destination['time'] / 60).toFixed(1))} min
          <br />
          Erfordert ${destination['trans']} mal Umsteigen`
        }
      }))
    }

    const sourceData = {
      type: 'geojson',
      data: geojsonData
    }

    let source

    const doTheThing = () => {
      source = map.current.getSource('destinations')
      if (source) {
        source.setData(sourceData.data)
      } else {
        map.current.addSource('destinations', sourceData)
        source = map.current.getSource('destinations')
      }

      if (!map.current.getLayer('destinations')) {
        map.current.addLayer({
          id: 'destinations',
          type: 'circle',
          source: 'destinations',
          layout: { 'circle-sort-key': ['get', 'time'] },
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              // zoom <= 10 -> 5px
              10,
              5,
              // zoom >= 13 -> 11px
              13,
              11
            ],
            'circle-color': ['get', 'color'],
            'circle-stroke-width': 1,
            'circle-stroke-color': '#000'
          }
        })
      }
    }
    if (map.current.loaded()) {
      doTheThing()
    } else {
      map.current.on('load', doTheThing)
    }
  }, [map, selectedStop, day, mapShowTransfers])

  // Set map location & zoom on stop selection
  useEffect(() => {
    if (!(selectedStop.available && map.current)) return

    const currentlySelectedDay = dayRef.current
    const destinations =
      selectedStop.stop.travelTimes[currentlySelectedDay].destinations

    const destLat = destinations.map(c => c['coord'][1])
    const destLng = destinations.map(c => c['coord'][0])
    const handle = window.setTimeout(() => {
      //map.invalidateSize()
      if (destLat.length > 0 && destLng.length > 0) {
        map.current.fitBounds(
          [
            [Math.min(...destLat), Math.min(...destLng)],
            [Math.max(...destLat), Math.max(...destLng)]
          ],
          { padding: 50 }
        )
      } else {
        map.current.easeTo({
          center: [
            selectedStop.stop.travelTimes[currentlySelectedDay]['stop_info'][
              'coord'
            ][1],
            selectedStop.stop.travelTimes[currentlySelectedDay]['stop_info'][
              'coord'
            ][0]
          ],
          zoom: 13
        })
      }
    }, 100)
    return () => window.clearTimeout(handle)
  }, [map, selectedStop])

  // Build custom map controls
  const mapControls = useMemo(() => {
    return (
      <div className={styles.customMapControls}>
        <div className={styles.customMapControl}>
          <Stack direction='row' spacing={0} alignItems='center'>
            <div
              className={styles.indicator}
              style={{ backgroundColor: colorMapAlt(1) }}
            />
            <span>Ohne umsteigen</span>
            <Switch
              defaultChecked
              onChange={(ev, checked) => setMapShowTransfers(checked)}
              inputProps={{ 'aria-label': 'Mit umsteigen' }}
            />
            <div
              className={styles.indicator}
              style={{ backgroundColor: colorMapAlt(0.33) }}
            />
            <span>Mit umsteigen</span>
          </Stack>
        </div>
      </div>
    )
  }, [])

  return (
    <div className={styles.mapWrap}>
      <div ref={mapContainer} className={styles.map} />
      {props.children}
      {mapControls}
    </div>
  )
}