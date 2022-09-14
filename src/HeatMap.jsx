import React from 'react'
import { useMemo } from 'react'
import clsx from 'clsx'

import { colorMapMain, colorMapAlt } from './colorMap'

import styles from './HeatMap.module.scss'

const WEEKDAYS = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag'
]

const HeatMap = ({ data, ...rest }) => {
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

  const max = useMemo(() => {
    return Math.max(...Object.values(data).flat())
  }, [data])

  const min = useMemo(() => {
    return Math.min(...Object.values(data).flat())
  }, [data])

  return (
    <div {...rest} className={clsx(styles.heatmap, rest.className)}>
      {WEEKDAYS.map((day, i) => (
        <div key={i} className={styles.row}>
          <span className={styles.day}>{day.slice(0, 2)}</span>
          <div className={styles.bar}>
            {data[day].map((value, j) => (
              <div
                key={j}
                className={styles.cell}
                style={{
                  backgroundColor:
                    value > 0
                      ? colorMapMain(1 - (value - min) / max)
                      : '#f8f8f8'
                }}
              >
                <div className={styles.tooltip}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className={styles.hours}>
        {[0, 1, 2, 3, 4, 5, 6]
          .map(hour => `${hour * 4}`)
          .map(hour => (
            <div className={styles.tick}>{hour}</div>
          ))}
      </div>
    </div>
  )
}

export default HeatMap
