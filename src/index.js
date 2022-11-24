import React from 'react'
import ReactDOM from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { TourProvider } from '@reactour/tour'


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
      paddingTop: '1rem',
      paddingBottom: '0.5rem'
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

const tourSteps = [
  {
    selector: '.tour-search',
    content: 'Hier nach Haltestellen in ganz NRW suchen!'
  },
  {
    selector: '.tour-faq',
    content:
      'Fragen zur Benutzung oder den Daten? Hier gibt es zusätzliche Informationen.',
    position: 'left',
    styles: {
      ...tourStyles,
      maskArea: (base, { x, y, width, height }) => ({
        ...base,
        rx: 10,
        height: height - 12,
        width: width - 12,
        x: x + 6
      })
    }
  },
  {
    selector: '.tour-article',
    content: 'Was wir mit den Daten herausgefunden haben - hier zum Nachlesen.',
    position: 'bottom',
    styles: {
      ...tourStyles,
      maskArea: (base, { x, y, width, height }) => ({
        ...base,
        rx: 10,
        height: height - 12,
        width: width - 12,
        x: x + 6
      })
    }
  }
]

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
