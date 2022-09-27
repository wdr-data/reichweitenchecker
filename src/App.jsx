import * as React from 'react'
import { useState, useCallback, useEffect, useMemo, useReducer } from 'react'

import clsx from 'clsx'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Skeleton from '@mui/material/Skeleton'
import { useTour } from '@reactour/tour'

import styles from './App.module.scss'
import VirtualizedAutocomplete from './VirtualizedAutocomplete'
import HeatMap from './HeatMap'
import Map from './Map'
import FAQ from './FAQ'
import { format } from './util'

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

const startStopName = ['#faq', '#close'].includes(window.location.hash)
  ? ''
  : decodeURIComponent(window.location.hash.slice(1))

const skeleton = (
  <div className={styles.skeleton}>
    {/* Switch */}
    <Skeleton variant='rounded' height={30} sx={{ marginTop: '1rem' }} />

    {/* Station name */}
    <Skeleton width='60%' sx={{ fontSize: '1.5rem', marginTop: '0.75rem' }} />
    <Skeleton width='30%' />

    {/* Station ranking */}
    <Skeleton width='90%' sx={{ marginTop: '0.75rem' }} />
    <Skeleton width='95%' />
    <Skeleton width='85%' />
    <Skeleton width='88%' />
    <Skeleton variant='rounded' height={20} sx={{ marginTop: '0.75rem' }} />
    <Skeleton
      width='45%'
      sx={{ display: 'inline-block', marginRight: '30%' }}
    />
    <Skeleton width='25%' sx={{ display: 'inline-block' }} />

    {/* Heatmap */}
    <Skeleton width='65%' sx={{ fontSize: '1.5rem', marginTop: '0.75rem' }} />
    {[...Array(7)].map((_, i) => (
      <Skeleton
        key={i}
        width='90%'
        variant='rounded'
        height={20}
        sx={{ marginBottom: '5px', marginLeft: '10%' }}
      />
    ))}

    {/* Heatmap legend */}
    <Skeleton
      variant='rounded'
      height={20}
      sx={{ marginBottom: '5px', marginTop: '2rem' }}
    />
    <Skeleton
      width='25%'
      sx={{ display: 'inline-block', marginRight: '10%' }}
    />
    <Skeleton
      width='25%'
      sx={{ display: 'inline-block', marginRight: '15%' }}
    />
    <Skeleton width='25%' sx={{ display: 'inline-block' }} />

    {/* Route types */}
    <Skeleton width='45%' sx={{ fontSize: '1.5rem', marginTop: '0.75rem' }} />
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

const STOP_STATE_INITIAL = {
  loading: false,
  stop: {},
  stopName: '',
  available: false
}

const ACTION_TYPES = {
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_CLEAR: 'FETCH_CLEAR'
}

export const stopReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.FETCH_START:
      return {
        loading: true,
        stop: {},
        stopName: action.stopName,
        available: false
      }
    case ACTION_TYPES.FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        stop: action.stop,
        available: true
      }
    case ACTION_TYPES.FETCH_CLEAR:
      return STOP_STATE_INITIAL
    default:
      return state
  }
}

function App () {
  const { setIsOpen: setTourIsOpen } = useTour()

  useEffect(() => {
    if (!window.location.hash) {
      setTourIsOpen(true)
    }
  }, [setTourIsOpen])

  const [travelStops, setTravelStops] = useState([])

  const [selectedStop, selectedStopDispatch] = useReducer(
    stopReducer,
    STOP_STATE_INITIAL
  )
  const selectedStopRef = React.useRef(null)
  useEffect(() => {
    selectedStopRef.current = selectedStop
  }, [selectedStop])

  // FAQ dialog handling
  const [faqOpen, setFaqOpen] = useState(false)
  const handleFAQClose = useCallback(() => {
    window.location.hash = selectedStop.available
      ? fixedEncodeURIComponent(selectedStop.stopName)
      : ''
    setFaqOpen(false)
  }, [selectedStop])

  const [day, setDay] = useState('Werktag')

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

  // Load stop data on selection
  const handleStopChange = useCallback(async (event, stop) => {
    if (!stop) {
      selectedStopDispatch({ type: ACTION_TYPES.FETCH_CLEAR })
      return
    }
    if (stop.label === selectedStopRef.current?.stopName) {
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

  // Listen to location hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#faq') {
        setFaqOpen(true)
        return
      } else {
        setFaqOpen(false)
      }

      if (['', '#'].includes(window.location.hash)) {
        handleStopChange(null, null)
        return
      }

      // seems to be a firefox mobile thing??
      if (window.location.hash === '#close') {
        return
      }

      const stopName = decodeURIComponent(window.location.hash.slice(1))
      if (stopName) {
        handleStopChange(null, { label: stopName })
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [handleStopChange])

  // Load stop from URL location hash on page load
  useEffect(() => {
    if (!travelStops) return
    if (window.location.hash) {
      if (window.location.hash === '#faq') {
        setFaqOpen(true)
        return
      } else if (window.location.hash === '#close') {
        window.location.hash = ''
        return
      }
      handleStopChange(null, {
        label: decodeURIComponent(window.location.hash.slice(1))
      })
    }
  }, [travelStops, handleStopChange])

  // Build search field
  const searchField = useMemo(
    () => (
      <VirtualizedAutocomplete
        className={clsx(
          styles.searchField,
          !selectedStop.available && styles.searchFieldInitial,
          'tour-search'
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
        onSelect={() => setTourIsOpen(false)}
      />
    ),
    [travelStops, handleStopChange, selectedStop, setTourIsOpen]
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
      <>
        <HeatMap
          className={styles.heatmap}
          data={selectedStop.stop.stats['heatmap']}
        />
        <div className={styles.heatmapLegend}>
          <div
            className={clsx(styles.distributionBar, styles.distributionZero)}
          />
          <div
            className={clsx(styles.distributionBar, styles.heatmapLegendBar)}
          />
          <div className={styles.labelZero}>
            <span>Keine Fahrten</span>
          </div>
          <div className={styles.labelMin}>
            <span>Wenige Fahrten</span>
          </div>
          <div className={styles.labelMax}>
            <span>Viele Fahrten</span>
          </div>
        </div>
      </>
    )
  }, [selectedStop])

  // Build ranking text & distribution bar
  const ranking = useMemo(
    () =>
      selectedStop.available && (
        <div className={styles.ranking}>
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

          <div className={styles.barLegendCircles}>
            <div className={styles.barLegendCirclesItem}>
              <div
                className={styles.barLegendCircle}
                style={{ backgroundColor: '#444' }}
              />
              <span className={styles.barLegendCircleLabel}>
                Gleich viel/weniger Fahrten
              </span>
            </div>

            <div className={styles.barLegendCirclesItem}>
              <div
                className={styles.barLegendCircle}
                style={{ backgroundColor: '#3a4' }}
              />
              <span className={styles.barLegendCircleLabel}>Mehr Fahrten</span>{' '}
            </div>
          </div>
        </div>
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
        <div
          className={styles.distributionBar}
          style={{
            backgroundColor:
              colorMapRouteTypes[
                routeTypePercentages[routeTypePercentages.length - 1].type
              ]
          }}
        >
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
        <div className={styles.barLegendCircles}>
          {routeTypePercentages.map(({ type, percentage }) => (
            <div key={type} className={styles.barLegendCirclesItem}>
              <div
                className={styles.barLegendCircle}
                style={{ backgroundColor: colorMapRouteTypes[type] }}
              />
              <div className={styles.barLegendCircleLabel}>
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
            src={`${process.env.PUBLIC_URL}/img/wdr_logo.svg`}
            alt='WDR Logo'
            className={styles.logo}
          />
        </a>
        <a
          href='#faq'
          aria-label='FAQ anzeigen'
          className={clsx(styles.faqButton, 'tour-faq')}
          onClick={() => {
            setTourIsOpen(false)
            setFaqOpen(true)
          }}
        >
          &#70;
        </a>
      </div>
      <FAQ open={faqOpen} handleClose={handleFAQClose} />
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
          <Map selectedStop={selectedStop} day={day} />
        </div>
      </div>
      <div className={styles.footer}>
        <span>&copy; WDR 2022</span>&nbsp;|&nbsp;
        <a href='https://www1.wdr.de/impressum/index.html'>Impressum</a>
        &nbsp;|&nbsp;
        <a href='https://www1.wdr.de/hilfe/datenschutz102.html'>Datenschutz</a>
        &nbsp;|&nbsp;
        <a href='https://www1.wdr.de/kontakt/index.html'>Kontakt</a>
      </div>
    </div>
  )
}

export default App
