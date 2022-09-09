import React from 'react'
import { Group } from '@visx/group'
import { scaleLinear, scaleOrdinal } from '@visx/scale'
import { HeatmapRect } from '@visx/heatmap'
import { AxisLeft, AxisBottom, AxisRight } from '@visx/axis'
import { useTooltip, useTooltipInPortal, defaultStyles as defaultTooltipStyles } from '@visx/tooltip';
import { Text } from '@visx/text';
import { localPoint } from '@visx/event';
import { useMemo } from 'react'

import {colorMapMain, colorMapAlt} from './colorMap'

const tooltipStyles = {
  ...defaultTooltipStyles,
  width: 20,
  fontSize: 16,
  textAlign: 'center',
  backgroundColor: 'rgba(0,0,0,0.9)',
  color: 'white',
};


const WEEKDAYS = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag'
]

function max (data, value) {
  return Math.max(...data.map(value))
}

function min (data, value) {
  return Math.min(...data.map(value))
}

// accessors
const bins = d => d.bins
const count = d => d.count

const margin = { top: 15, left: 30, right: 40, bottom: 40 }

let tooltipTimeout;

const HeatMap = ({ width, height, data, ...rest }) => {
  // data structure looks like this:
  /*
  {'Montag': [43, 189, 231, 230, 232, 227],
 'Dienstag': [43, 188, 231, 228, 232, 227],
 'Mittwoch': [43, 188, 231, 228, 233, 228],
 'Donnerstag': [43, 190, 231, 229, 234, 228],
 'Freitag': [43, 190, 232, 233, 233, 223],
 'Samstag': [62, 131, 196, 192, 199, 206],
 'Sonntag': [65, 102, 179, 190, 187, 211]}
 */

  const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } = useTooltip();

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
  // TooltipInPortal is rendered in a separate child of <body /> and positioned
  // with page coordinates which should be updated on scroll. consider using
  // Tooltip or TooltipWithBounds if you don't need to render inside a Portal
  scroll: true,
  });

  const binData = useMemo(
    () =>
      Array(data["Montag"].length)
        .fill(0)
        .map((_, row) => ({
          bin: row,
          bins: Object.entries(data).map(([weekday, binnedDepartures]) => ({
            bin: weekday,
            count: binnedDepartures[row] || 0
          }))
        })),
    [data]
  )

  // bounds
  const size = width - margin.left - margin.right
  const xMax = size
  const yMax = height - margin.bottom - margin.top

  const colorMax = max(binData, d => max(bins(d), count))
  const bucketSizeMax = max(binData, d => bins(d).length)

  const binWidth = xMax / binData.length
  const binHeight = yMax / bucketSizeMax

  const xScale = scaleLinear({
    domain: [0, binData.length],
    range: [0, xMax]
  })
  const yScale = scaleLinear({
    domain: [0, bucketSizeMax],
    range: [0, yMax]
  })
  const colorScale = n => n > 0 ? colorMapMain(1 - n / colorMax) : '#f8f8f8'

  // scales for axes
  const weekdayScale = scaleOrdinal({
    domain: WEEKDAYS.map(weekday => weekday.slice(0, 2)),
    range: WEEKDAYS.map((_, i) => i * binHeight + binHeight / 2)
  })
  // const totalDepartures = WEEKDAYS.map(
  //   (weekday, i) =>
  //     [0, ...data[weekday]].reduce((a, b) => a + b).toString() + ' '.repeat(i)
  // )
  const totalDepScale = scaleOrdinal({
    domain: WEEKDAYS.map(
      (weekday, i) =>
        [0, ...data[weekday]].reduce((a, b) => a + b).toString() + ' '.repeat(i)
    ),
    range: WEEKDAYS.map((_, i) => i * binHeight + binHeight / 2)
  })
  const hourScale = scaleOrdinal({
    domain: [0, 1, 2, 3, 4, 5, 6].map(hour => `${hour * 4}`),
    range: Array(7)
      .fill(0)
      .map((_, i) => i * binWidth * data["Montag"].length / 24 * 4)
  })

  return width < 10 ? null : (
    <>
    <svg width={width} height={height} ref={containerRef} {...rest}>
      <Group top={margin.top} left={margin.left}>
        <AxisLeft
          scale={weekdayScale}
          tickLabelProps={() => ({ fontSize: 15, textAnchor: 'end' })}
          hideTicks={true}
          hideAxisLine={true}
          top={7}
          left={0}
        />
        <AxisRight
          scale={totalDepScale}
          tickLabelProps={() => ({ fontSize: 15, textAnchor: 'start'})}
          hideTicks={true}
          hideAxisLine={true}
          top={7}
          left={xMax - 5}
        />
        <AxisBottom
          scale={hourScale}
          tickLabelProps={() => ({ fontSize: 15, textAnchor: 'middle' })}
          hideTicks={true}
          hideAxisLine={true}
          top={yMax - 5}
          left={-2.5}
        />
        <Text x={xMax - 10} y={-5} fontSize={15} textAnchor="right">
          Summe
        </Text>
        <HeatmapRect
          data={binData}
          xScale={d => xScale(d) ?? 0}
          yScale={d => yScale(d) ?? 0}
          colorScale={colorScale}
          // opacityScale={opacityScale}
          binWidth={binWidth}
          binHeight={binHeight}
          gap={5}
        >
          {heatmap =>
            heatmap.map(heatmapBins =>
              heatmapBins.map(bin => (
                <rect
                  key={`heatmap-rect-${bin.row}-${bin.column}`}
                  className='visx-heatmap-rect'
                  width={Math.round(bin.width + 6)}
                  height={Math.round(bin.height)}
                  x={Math.round(bin.x - 3)}
                  y={Math.round(bin.y)}
                  fill={bin.color}
                  fillOpacity={bin.opacity}
                  // onClick={() => {
                  //   const { row, column } = bin;
                  //   alert(JSON.stringify({ row, column, bin: bin.bin }));
                  // }}

                  onMouseLeave={() => {
                    tooltipTimeout = window.setTimeout(() => {
                      hideTooltip();
                    }, 300);
                  }}
                  onMouseMove={(event) => {
                    if (tooltipTimeout) clearTimeout(tooltipTimeout);
                    // TooltipInPortal expects coordinates to be relative to containerRef
                    // localPoint returns coordinates relative to the nearest SVG, which
                    // is what containerRef is set to in this example.
                    const eventSvgCoords = localPoint(event);
                    showTooltip({
                      tooltipData: bin,
                      tooltipTop: eventSvgCoords.y,
                      tooltipLeft: eventSvgCoords.x,
                    });
                  }}
                />
              ))
            )
          }
        </HeatmapRect>
      </Group>
    </svg>

    {tooltipOpen && tooltipData && (
        <TooltipInPortal top={tooltipTop - 40} left={tooltipLeft - 28} style={tooltipStyles}>
          {tooltipData.count}
        </TooltipInPortal>
      )}
    </>
  )
}

export default HeatMap
