import { interpolateInferno /*, interpolatePlasma */ } from 'd3-scale-chromatic'

export default function colorMap(fac) {
    const color = interpolateInferno(fac * 0.90 + 0.1)
    return color
}
