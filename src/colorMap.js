import { interpolateMagma, interpolateBuGn } from 'd3-scale-chromatic'

export function colorMapMain(fac) {
    const color = interpolateMagma(fac * 0.90 + 0.1)
    return color
}

export function colorMapAlt(fac) {
    return interpolateBuGn(fac * 0.90 + 0.1)
}
