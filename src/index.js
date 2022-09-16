import React from 'react'
import ReactDOM from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'

const theme = createTheme({
  typography: {
    fontFamily: ['Thesis', 'sans-serif'].join(','),
    allVariants: {
      color: '#000000'
    },
    body1: {
      marginBottom: '.75rem',
      marginTop: '0'
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

const root = ReactDOM.createRoot(document.getElementById('map-widget'))
root.render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log)
