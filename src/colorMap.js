import { scaleLinear } from 'd3-scale';
import { rgb } from 'd3-color';
import { interpolateRgb, interpolateHcl } from 'd3-interpolate';
import { interpolateMagma, interpolateBlues } from 'd3-scale-chromatic'


export function colorMapMain(fac) {
    const color = interpolateMagma(fac * 0.90 + 0.1)
    return color
}
const interpolateAlt = scaleLinear().domain([0, 1])
    .interpolate(interpolateHcl)
    .range([rgb("#fff"), rgb('#00345f')]);

export function colorMapAlt(fac) {
    return interpolateAlt(fac)
}
