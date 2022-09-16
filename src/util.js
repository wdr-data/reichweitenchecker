

const numberFormatter = new Intl.NumberFormat('de-DE')

export function format (number) {
  return numberFormatter.format(number)
}
