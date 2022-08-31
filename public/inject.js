let thisElement = document.getElementById('map-widget-inject')
let container = document.createElement('div')
container.id = 'map-widget'
thisElement.insertAdjacentElement('beforebegin', container)

let head = document.getElementsByTagName('head')[0]

head.insertAdjacentHTML(
  'beforeend',
  `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.8.0/dist/leaflet.css"
integrity="sha512-hoalWLoI8r4UszCkZ5kL8vayOGVae1oxXe/2A4AO6J9+580uKHDO3JdHb7NzwwzK5xr/Fs0W40kiNHxM9vyTtQ=="
crossorigin=""/>
<link
rel="stylesheet"
href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
/>
<link
rel="stylesheet"
href="https://fonts.googleapis.com/icon?family=Material+Icons"
/>
<link href="https://files.jhoeke.de/files/map-widget/static/css/main.8e25b83a.css" rel="stylesheet">
`
)

let scriptLeaflet = document.createElement('script')
scriptLeaflet.src = "https://unpkg.com/leaflet@1.8.0/dist/leaflet.js"
//scriptLeaflet.integrity="sha512-BB3hKbKWOc9Ez/TAwyWxNXeoV9c1v6FIeYiBieIWkpLjauysF18NzgR1MBNBXf8/KABdlkX68nAhlwcDFLGPCQ=="
//scriptLeaflet.crossorigin="";
thisElement.insertAdjacentElement('afterend', scriptLeaflet)

let scriptMapWidget = document.createElement('script')
scriptMapWidget.src = "https://files.jhoeke.de/files/map-widget/static/js/main.75617652.js"
scriptMapWidget.defer = "defer"
thisElement.insertAdjacentElement('afterend', scriptMapWidget)
