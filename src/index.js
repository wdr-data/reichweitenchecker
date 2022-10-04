import React from 'react'
import ReactDOM from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { TourProvider } from '@reactour/tour'

// Analytics
import { pianoAnalytics } from 'piano-analytics-js'

pianoAnalytics.setConfigurations({
  site: process.env.REACT_APP_ATI_ID,
  collectDomain: process.env.REACT_APP_ATI_COLLECT_URL
})

pianoAnalytics.sendEvent('page.display', {
  's:site_level2': 'data.wdr.de',
  's:brand': 'WDR',
  's:platform': 'Web',
  's:editorial_department': 'Newsroom',
  's:page_type': 'Interaktive Web-Anwendung',
  's:page_title': 'WDR-Reichweiten-Checker',
  's:page_chapter1': 'DDJ-Projekt',
  's:page_chapter2': 'WDR-Reichweiten-Checker',
  's:page': 'data.wdr.de_Interaktive Web-Anwendung_WDR-Reichweiten-Checker',
  'd:publication_time': '2022-10-05',
  'd:last_editorial_update': '2022-10-05'
})

const theme = createTheme({
  typography: {
    fontFamily: ['Thesis', 'sans-serif'].join(','),
    allVariants: {
      color: '#000000'
    },
    body1: {
      marginBottom: '.75rem',
      marginTop: '0'
    },
    h6: {
      lineHeight: '2.5'
    }
  },
  palette: {
    primary: {
      main: '#00345f'
    },
    secondary: {
      main: '#b37500'
    }
  }
})

const tourSteps = [
  {
    selector: '.tour-search',
    content: 'Hier nach Haltestellen in ganz NRW suchen!'
  },
  {
    selector: '.tour-faq',
    content:
      'Fragen zur Benutzung oder den Daten? Hier gibt es zusätzliche Informationen.',
    position: 'left'
  }
]

const tourStyles = {
  popover: (base, { x, y, width, height }) => ({
    ...base,
    '--reactour-accent': '#00345f',
    borderRadius: 10,
    paddingTop: 10,
    paddingBottom: 6,
    paddingLeft: 14,
    paddingRight: 24,
    maxWidth: 250
  }),
  maskArea: (base, { x, y, width, height }) => ({
    ...base,
    rx: 10,
    height: height - 12
  }),
  maskWrapper: base => ({
    ...base,
    color: '#b37500'
  }),
  badge: base => ({
    ...base,
    left: 'auto',
    right: '-0.8125em',
    display: 'none'
  }),
  controls: base => ({
    ...base,
    marginTop: 10,
    marginRight: -10
  }),
  close: base => ({
    ...base,
    right: 8,
    top: 8,
    width: 12,
    height: 12
  }),
  arrow: base => ({
    ...base,
    width: 20,
    height: 20
  })
}

const root = ReactDOM.createRoot(document.getElementById('map-widget'))
root.render(
  <ThemeProvider theme={theme}>
    <TourProvider steps={tourSteps} styles={tourStyles}>
      <App />
    </TourProvider>
  </ThemeProvider>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log)
