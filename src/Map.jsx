import React, { useRef, useEffect, useState, useMemo } from 'react'
import { alpha, styled } from '@mui/material/styles'
import Switch from '@mui/material/Switch'
import Stack from '@mui/material/Stack'

// eslint-disable-next-line import/no-webpack-loader-syntax
import maplibregl from '!maplibre-gl' // ! is important here
import maplibreglWorker from 'maplibre-gl/dist/maplibre-gl-csp-worker'

import { colorMapAlt } from './colorMap'

import styles from './Map.module.scss'
import 'maplibre-gl/dist/maplibre-gl.css'

import customMarkerImg from './img/haltestelle_marker.svg'

import mapStyle from './map-style.json'

maplibregl.workerClass = maplibreglWorker

const TransfersSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase': {
    color: colorMapAlt(1),
    '&:hover': {
      backgroundColor: alpha(colorMapAlt(1), theme.palette.action.hoverOpacity)
    }
  },
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: colorMapAlt(0.4),
    '&:hover': {
      backgroundColor: alpha(
        colorMapAlt(0.4),
        theme.palette.action.hoverOpacity
      )
    }
  },
  '& .MuiSwitch-switchBase + .MuiSwitch-track': {
    backgroundColor: colorMapAlt(1)
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: colorMapAlt(0.4)
  }
  // '& .MuiSwitch-thumb': {
  //   border: `1px solid black`,
  // }
}))

const bounds = [
  [4.21, 48.51],
  [11.77, 53.44]
]

// see: https://learn.microsoft.com/en-us/bingmaps/rest-services/imagery/get-imagery-metadata
const imagerySet = 'RoadOnDemand'

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

    // this is necessary to get the current tile URL
    // since tile URLs for Bing Maps change regularly
    // read more about this here: https://learn.microsoft.com/en-us/bingmaps/rest-services/directly-accessing-the-bing-maps-tiles
    fetch(`https://dev.virtualearth.net/REST/V1/Imagery/Metadata/${imagerySet}?uriScheme=https&output=json&include=ImageryProviders&key=${process.env.REACT_APP_BING_KEY}`)
      .then((res) => res.json())
      .then((data) => {
        const resource = data.resourceSets[0].resources[0]
        mapStyle.sources.bing.tiles = resource.imageUrlSubdomains.map(
          (subdomain) => resource.imageUrl.replace(/{subdomain}/g, subdomain)
        )

        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: mapStyle,
          zoom: 8,
          center: [13.42475, 52.50720], // center of berlin
          // maxBounds: bounds, // TODO add max bounds
          dragRotate: false,
          touchPitch: false,
          attributionControl: false //new maplibregl.AttributionControl()//`<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>`,
        })
    
        map.current.addControl(
          new maplibregl.AttributionControl({
            customAttribution: [
              `<a href="https://www.microsoft.com/" rel="nofollow" target="_blank">© 2022 Microsoft Corporation</a>`,
              `<a href="https://www.delfi.de/" rel="nofollow" target="_blank">© DELFI</a>`,
            ]
          }),
          'bottom-right'
        )
    
        map.current.touchZoomRotate.disableRotation()
        // TODO fit bounds
        // map.current.fitBounds([
        //   [5.8941, 50.3103],
        //   [9.4868, 52.5295]
        // ])
        map.current.addControl(
          new maplibregl.NavigationControl({
            showCompass: false,
            visualizePitch: false
          }),
          'bottom-right'
        )
      });

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
      selectedStop.stop.travelTimes[dayRef.current]['stop_info']['coord']
    const marker = new maplibregl.Marker({
      anchor: 'bottom',
      element: markerSvg
    }).setLngLat([markerLocation[1], markerLocation[0]])
    marker.addTo(map.current)
    return () => marker.remove()
  }, [map, selectedStop])

  // Destination unloading
  useEffect(() => {
    if (map.current)
      map.current
        .getSource('destinations')
        ?.setData({ type: 'FeatureCollection', features: [] })
  }, [map, selectedStop])

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
          ${
            destination['from'] &&
            destination['from'] !== selectedStop.stop.stats.stop_name
              ? `Abfahrt von ${destination['from']} <br />`
              : ''
          }
          Erreichbar in ${Math.ceil(destination['time'] / 60)} min
          <br />
          Erfordert ${destination['trans']} Mal umsteigen`
        }
      }))
    }

    const sourceData = {
      type: 'geojson',
      data: geojsonData
    }

    const source = map.current.getSource('destinations')

    const doTheThing = () => {
      let source = map.current.getSource('destinations')
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
              4,
              // zoom >= 13 -> 11px
              13,
              11
            ],
            'circle-color': ['get', 'color'],
            'circle-stroke-width': 1,
            'circle-stroke-color': 'rgba(0,0,0,0.66)'
          }
        })
      }
    }

    // Map is loading and source has not been created yet
    if (!map.current.isStyleLoaded() && !source) {
      map.current.once('load', doTheThing)
      // Map has loaded and source has been created, but is still processing a change
    } else if (source && !map.current.isSourceLoaded('destinations')) {
      map.current.once('sourcedata', e => {
        if (e.sourceId === 'destinations') {
          doTheThing()
        }
      })
      // Map has loaded and source has been created and is ready
    } else {
      doTheThing()
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
            <span>ohne umsteigen</span>
            <TransfersSwitch
              defaultChecked
              onChange={(ev, checked) => setMapShowTransfers(checked)}
              inputProps={{ 'aria-label': 'Mit umsteigen' }}
            />
            <span>mit umsteigen</span>
            <div
              className={styles.indicator}
              style={{ backgroundColor: colorMapAlt(0.33) }}
            />
          </Stack>
        </div>
      </div>
    )
  }, [])

  return (
    <div className={styles.mapWrap}>
      {mapControls}
      <div ref={mapContainer} className={styles.map} />
      {props.children}
    </div>
  )
}
