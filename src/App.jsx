import * as React from 'react'
import { useState, useCallback, useEffect, useMemo, useReducer } from 'react'

import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  Popup
} from 'react-leaflet'
import { Icon, Point } from 'leaflet'
import clsx from 'clsx'
import Switch from '@mui/material/Switch'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Skeleton from '@mui/material/Skeleton'

import styles from './App.module.scss'
import VirtualizedAutocomplete from './VirtualizedAutocomplete'
import HeatMap from './HeatMap'
import { colorMapMain, colorMapAlt } from './colorMap'

import customMarkerImg from './img/haltestelle_marker.svg'

const customMarker = new Icon({
  iconUrl: customMarkerImg,
  iconRetinaUrl: customMarkerImg,
  iconAnchor: new Point(17, 50),
  popupAnchor: null,
  shadowUrl: null,
  shadowSize: null,
  shadowAnchor: null,
  iconSize: new Point(34, 50)
})

const WEEKDAYS = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag'
]

const DAYS_LESS = ['Werktag', 'Samstag', 'Sonntag']

const colorMapRouteTypes = {
  'Kabel-Straßenbahn': '#fb9a99',
  Straßenbahn: '#e31a1c',
  'S-Bahn': '#33a02c',
  'U-Bahn': '#1f78b4',
  Bahn: '#a6cee3',
  Regionalbahn: '#b2df8a',
  Fernzug: '#fdbf6f',
  Hochgeschwindigkeitszug: '#ff7f00',
  Fähre: '#cab2d6',
  Bus: '#6a3d9a'
}

function fixedEncodeURIComponent (str) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    c =>
      `%${c
        .charCodeAt(0)
        .toString(16)
        .toUpperCase()}`
  )
}

function encodeFileName (fileName) {
  return encodeURIComponent(
    encodeURIComponent(fixedEncodeURIComponent(fileName))
    //fixedEncodeURIComponent(fileName)
  )
}

const numberFormatter = new Intl.NumberFormat('de-DE')

function format (number) {
  return numberFormatter.format(number)
}

const startStopName = decodeURIComponent(window.location.hash.slice(1))

const skeleton = (
  <div className={styles.skeleton}>
    <Skeleton variant='rounded' height={30} sx={{ marginTop: '1rem' }} />
    <Skeleton width='60%' sx={{ fontSize: '2rem', marginTop: '1rem' }} />
    <Skeleton width='30%' />
    <Skeleton width='90%' sx={{ marginTop: '1rem' }} />
    <Skeleton width='95%' />
    <Skeleton width='85%' />
    <Skeleton width='88%' />
    <Skeleton width='60%' />
    <br />
    <Skeleton variant='rounded' height={20} />
    <br />
    <Skeleton width='65%' sx={{ fontSize: '2rem' }} />
    <Skeleton
      width='90%'
      variant='rounded'
      height={20}
      sx={{ marginBottom: '5px', marginLeft: '10%' }}
    />
    <Skeleton
      width='90%'
      variant='rounded'
      height={20}
      sx={{ marginBottom: '5px', marginLeft: '10%' }}
    />
    <Skeleton
      width='90%'
      variant='rounded'
      height={20}
      sx={{ marginBottom: '5px', marginLeft: '10%' }}
    />
    <Skeleton
      width='90%'
      variant='rounded'
      height={20}
      sx={{ marginBottom: '5px', marginLeft: '10%' }}
    />
    <Skeleton
      width='90%'
      variant='rounded'
      height={20}
      sx={{ marginBottom: '5px', marginLeft: '10%' }}
    />
    <Skeleton
      width='90%'
      variant='rounded'
      height={20}
      sx={{ marginBottom: '5px', marginLeft: '10%' }}
    />
    <Skeleton
      width='90%'
      variant='rounded'
      height={20}
      sx={{ marginBottom: '5px', marginLeft: '10%' }}
    />
    <Skeleton width='45%' sx={{ fontSize: '2rem', marginTop: '1.75rem' }} />
    <Skeleton variant='rounded' height={20} />
    <Skeleton
      width='30%'
      sx={{ display: 'inline-block', marginRight: '.8rem' }}
    />
    <Skeleton
      width='60%'
      sx={{ display: 'inline-block', marginRight: '.8rem' }}
    />
    <Skeleton
      width='40%'
      sx={{ display: 'inline-block', marginRight: '.8rem' }}
    />
  </div>
)

const ACTION_TYPES = {
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_ERROR: 'FETCH_ERROR'
}

export const stopReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.FETCH_START:
      return {
        loading: true,
        error: false,
        stop: {},
        stopName: action.stopName,
        available: false
      }
    case ACTION_TYPES.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        error: false,
        stop: action.stop,
        available: true
      }
    case ACTION_TYPES.FETCH_ERROR:
      return {
        error: true,
        loading: false,
        stop: {},
        available: false
      }
    default:
      return state
  }
}

function App () {
  const [travelStops, setTravelStops] = useState([])
  const [map, setMap] = useState(null)

  const [selectedStop, selectedStopDispatch] = useReducer(stopReducer, {
    loading: false,
    stopName: '',
    stop: {},
    error: false,
    available: false
  })
  const selectedStopRef = React.useRef(null)

  useEffect(() => {
    selectedStopRef.current = selectedStop
  }, [selectedStop])

  const [day, setDay] = useState('Werktag')
  const dayRef = React.useRef(day)

  useEffect(() => {
    dayRef.current = day
  }, [day])

  // Load travel stops on page load
  useEffect(() => {
    async function fetchTravelStops () {
      const response = await fetch(
        `${process.env.REACT_APP_DATA_URL}/stops.json`
      )
      const data = await response.json()

      const dataPrepped = data.map(stop => ({
        label: stop[0],
        searchValue: stop[0].startsWith(stop[1])
          ? stop[0]
          : `${stop[1]} ${stop[0]}`
      }))

      setTravelStops(dataPrepped)
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
  const handleStopChange = useCallback(async (event, stop) => {
    if (!stop || stop.label === selectedStopRef.current?.stopName) {
      return
    }
    selectedStopDispatch({
      type: ACTION_TYPES.FETCH_START,
      stopName: stop.label
    })

    stop = stop.label
    const stopURLEncoded = encodeFileName(stop)
    const [
      responseTravelTimesMonday,
      responseTravelTimesSaturday,
      responseTravelTimesSunday,
      responseStopStats
    ] = await Promise.all([
      fetch(
        `${process.env.REACT_APP_DATA_URL}/travel_times_proc_monday/${stopURLEncoded}.json`
      ),
      fetch(
        `${process.env.REACT_APP_DATA_URL}/travel_times_proc_saturday/${stopURLEncoded}.json`
      ),
      fetch(
        `${process.env.REACT_APP_DATA_URL}/travel_times_proc_sunday/${stopURLEncoded}.json`
      ),
      fetch(
        `${process.env.REACT_APP_DATA_URL}/stop_stats/${stopURLEncoded}.json`
      )
    ])

    const [
      travelTimesMonday,
      travelTimesSaturday,
      travelTimesSunday,
      stopStats
    ] = await Promise.all([
      responseTravelTimesMonday.json(),
      responseTravelTimesSaturday.json(),
      responseTravelTimesSunday.json(),
      responseStopStats.json()
    ])

    // Closest last, so markers are on top
    travelTimesMonday['destinations'].reverse()
    travelTimesSaturday['destinations'].reverse()
    travelTimesSunday['destinations'].reverse()

    const stopData = {
      travelTimes: {
        Werktag: travelTimesMonday,
        Samstag: travelTimesSaturday,
        Sonntag: travelTimesSunday
      },
      stats: stopStats
    }

    selectedStopDispatch({ type: ACTION_TYPES.FETCH_SUCCESS, stop: stopData })
    window.location.hash = fixedEncodeURIComponent(stop)
  }, [])

  // Set map location & zoom on stop selection
  useEffect(() => {
    if (!(selectedStop.available && map)) return

    const currentlySelectedDay = dayRef.current
    const destinations =
      selectedStop.stop.travelTimes[currentlySelectedDay].destinations

    const destLat = destinations.map(c => c['coord'][0])
    const destLng = destinations.map(c => c['coord'][1])
    const handle = window.setTimeout(() => {
      console.log('current day', currentlySelectedDay)
      map.invalidateSize()
      if (destLat.length > 0 && destLng.length > 0) {
        map.fitBounds([
          [Math.min(...destLat), Math.min(...destLng)],
          [Math.max(...destLat), Math.max(...destLng)]
        ])
      } else {
        map.setView(
          selectedStop.stop.travelTimes[currentlySelectedDay]['stop_info'][
            'coord'
          ],
          13
        )
      }
    }, 100)
    return () => window.clearTimeout(handle)
  }, [map, selectedStop])

  // Load stop from URL location hash
  useEffect(() => {
    if (!travelStops || !map) return
    if (window.location.hash) {
      handleStopChange(null, {
        label: decodeURIComponent(window.location.hash.slice(1))
      })
    }
  }, [travelStops, handleStopChange, map])

  const [mapShowTransfers, setMapShowTransfers] = useState(true)

  // Build circle markers for each destination
  const circleMarkers = useMemo(() => {
    if (!selectedStop.available) {
      return []
    }

    return selectedStop.stop.travelTimes[day]['destinations'].map(
      destination => {
        if (!mapShowTransfers && destination['trans'] > 0) {
          return null
        }
        return (
          <CircleMarker
            key={`${destination['id']}_${destination['time']}_${day}_${mapShowTransfers}`}
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
              Erreichbar in {format((destination['time'] / 60).toFixed(1))} min
              <br />
              Erfordert {destination['trans']} mal Umsteigen
            </Popup>
          </CircleMarker>
        )
      }
    )
  }, [selectedStop, mapShowTransfers, day])

  // Build custom map controls
  const mapControls = useMemo(() => {
    return (
      <div className={styles.customMapControls}>
        <div className={styles.customMapControl}>
          <Stack direction='row' spacing={0} alignItems='center'>
            <span>Ohne Umsteigen</span>
            <Switch
              defaultChecked
              onChange={(ev, checked) => setMapShowTransfers(checked)}
              inputProps={{ 'aria-label': 'Mit Umsteigen' }}
            />
            <span>Mit Umsteigen</span>
          </Stack>
        </div>
      </div>
    )
  }, [])

  // Build search field
  const searchField = useMemo(
    () => (
      <VirtualizedAutocomplete
        className={clsx(
          styles.searchField,
          !selectedStop.available && styles.searchFieldInitial
        )}
        defaultValue={startStopName}
        options={travelStops}
        onChange={handleStopChange}
        blurOnSelect={true}
        loading={!travelStops.length}
        label='Haltestelle suchen'
        loadingText='Wird geladen...'
        noOptionsText='Keine Ergebnisse'
        clearText='Leeren'
        closeText='Schließen'
        openText='Öffnen'
        size='small'
      />
    ),
    [travelStops, handleStopChange, selectedStop]
  )

  // Day selector
  const daySelector = useMemo(
    () =>
      selectedStop.available && (
        <ButtonGroup
          disableElevation
          variant='contained'
          size='small'
          className={styles.dayButtonGroup}
        >
          {DAYS_LESS.map(day_ => (
            <Button
              key={day_}
              color={day === day_ ? 'secondary' : 'primary'}
              onClick={() => setDay(day_)}
            >
              {day_}
            </Button>
          ))}
        </ButtonGroup>
      ),
    [day, selectedStop]
  )

  // Build heatmap
  const heatmap = useMemo(() => {
    if (!selectedStop.available) return null
    return (
      <HeatMap
        className={styles.heatmap}
        data={selectedStop.stop.stats['heatmap']}
      />
    )
  }, [selectedStop])

  // Build ranking text & distribution bar
  const ranking = useMemo(
    () =>
      selectedStop.available && (
        <>
          <p>
            An einem {day} zwischen 6 und 20 Uhr gibt es an dieser Station
            durchschnittlich{' '}
            <b>
              {format(
                selectedStop.stop.stats['rank_data'][day][
                  'dep_per_hour_avg'
                ].toFixed(1)
              )}
            </b>{' '}
            Abfahrten pro Stunde. An{' '}
            <b>
              {format(
                (
                  selectedStop.stop.stats['rank_data'][day][
                    'dep_per_day_better'
                  ] * 100
                ).toFixed(1)
              )}
            </b>
            % aller Haltestellen in NRW gibt es mehr.
          </p>

          <div className={styles.distributionBar}>
            <div
              className={styles.distribution}
              style={{
                width: `${selectedStop.stop.stats['rank_data'][day][
                  'dep_per_day_worse'
                ] * 100}%`,
                backgroundColor: '#444'
              }}
            />
            <div
              className={styles.distribution}
              style={{
                width: `${selectedStop.stop.stats['rank_data'][day][
                  'dep_per_day_better'
                ] * 100}%`,
                backgroundColor: '#3a4'
              }}
            />
          </div>

          <div className={styles.ranksLegend}>
            <span className={styles.ranksLegendWorse}>
              gleich viel/weniger Fahrten
            </span>
            <span className={styles.ranksLegendBetter}>mehr Fahrten</span>
          </div>
        </>
      ),
    [selectedStop, day]
  )

  // Build route types distribution bar
  const routeTypes = useMemo(() => {
    if (!selectedStop.available) return null

    const routeTypes = selectedStop.stop.stats['route_types']
    const total = Object.values(routeTypes).reduce((a, b) => a + b, 0)
    const routeTypePercentages = Object.entries(routeTypes)
      .map(([key, value]) => ({
        type: key,
        percentage: (value / total) * 100
      }))
      .sort((a, b) => b.percentage - a.percentage)

    return (
      <div className={styles.routeTypes}>
        <div className={styles.distributionBar}>
          {routeTypePercentages.map(({ type, percentage }) => (
            <div
              key={type}
              className={styles.distribution}
              style={{
                width: `${percentage}%`,
                backgroundColor: colorMapRouteTypes[type]
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
                {type} ({format(percentage.toFixed(1))}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }, [selectedStop])

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
          {searchField}
          {selectedStop.available && (
            <div className={styles.charts}>
              {daySelector}
              <h2 className={styles.stopName}>
                {selectedStop.stop.stats['stop_name']}
              </h2>
              <span className={styles.municipality}>
                {selectedStop.stop.stats['municipality']}
              </span>
              {ranking}
              <h3 className={styles.chartTitle}>Abfahrten pro Stunde</h3>
              {heatmap}
              <h3 className={styles.chartTitle}>Verkehrsmittel</h3>
              {routeTypes}
            </div>
          )}
          {selectedStop.loading && skeleton}
        </div>

        <div className={styles.mapWrapper}>
          <h3 className={styles.mapTitle}>
            <b>Karte:</b> Welche Haltestellen sind in einer Stunde erreichbar?
          </h3>
          {daySelector}

          <MapContainer
            ref={setMap}
            className={styles.mapContainer}
            scrollWheelZoom={true}
            touchZoom={true}
          >
            {mapControls}

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />

            {circleMarkers}

            {selectedStop.available && (
              <Marker
                icon={customMarker}
                position={
                  selectedStop.stop.travelTimes[day]['stop_info']['coord']
                }
              />
            )}
          </MapContainer>
        </div>
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
