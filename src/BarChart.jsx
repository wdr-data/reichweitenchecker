import React, { useMemo } from 'react';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';


function getValue(d) {
  return d.value;
}

function getLabel(d) {
    return d.label;
}

const verticalMargin = 10;


export default function BarChart({ width, height, data, events = false }) {
  // bounds
  const xMax = width;
  const yMax = height - verticalMargin;

  // scales, memoize for performance
  const xScale = useMemo(
    () =>
      scaleBand({
        range: [0, xMax],
        round: true,
        domain: data.map(getLabel),
        padding: 0.4,
      }),
    [xMax, data],
  );
  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [yMax, 0],
        round: true,
        domain: [0, Math.max(...data.map(getValue))],
      }),
    [yMax, data],
  );

  return (
    <svg width={width} height={height}>
      <rect width={width} height={height} fill="url(#teal)" rx={14} />
      <Group top={verticalMargin / 2}>
        {data.map((d) => {
          const label = getLabel(d);
          const barWidth = xScale.bandwidth();
          const barHeight = yMax - (yScale(getValue(d)) ?? 0);
          const barX = xScale(label);
          const barY = yMax - barHeight;
          return (
            <Bar
              key={`bar-${label}`}
              x={barX}
              y={barY}
              width={barWidth}
              height={barHeight}
              fill="rgba(80, 100, 217, 1)"
              onClick={() => {
                if (events) console.log(`clicked: ${JSON.stringify(Object.values(d))}`);
              }}
            />
          );
        })}
      </Group>
    </svg>
  );
}
