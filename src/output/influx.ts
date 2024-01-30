import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client'
import { get } from 'underscore'
import { InfluxBindingConfig, InfluxApiConfig, Output, InfluxConfig } from '../model'
import { createLogger } from '../util'

const logger = createLogger('InfluxDB')

export const createInfluxWriteApi = (config: InfluxApiConfig): WriteApi => {
  const client = new InfluxDB({
    url: config.url,
    token: config.token,
    writeOptions: {
      batchSize: config.batchSize,
      flushInterval: config.flushIntervalMs,
      gzipThreshold: config.gzipThreshold
    }
  })

  return client.getWriteApi(config.org, config.bucket, 'ms')
}

export const toInfluxPoint = (data: Record<string, any>, config: InfluxBindingConfig, time?: Date): Point => {
  const { measurement, tags, fields, timestamp } = config
  const point = new Point(measurement)

  // Get timestamp from the data if it's defined.
  let pointTimestamp: Date | null = null
  if (timestamp && timestamp.key) {
    const { key, type } = timestamp
    const value: unknown = get(data, key.split('.'))
    if (typeof value === 'string') {
      pointTimestamp = new Date(type === 'number' ? Number(value) : value)
    }
  }

  if (!pointTimestamp) {
    pointTimestamp = time ? time : new Date()
  }

  point.timestamp(pointTimestamp)

  // Tags
  tags.forEach(t => {
    if (t.value) {
      point.tag(t.out, t.value)
    } else if (t.in) {
      const values = get(data, t.in)
      if (values.length) {
        point.tag(t.out, values[0])
      }
    }
  })

  // Fields
  fields.forEach(f => {
    const values = get(data, f.in)
    if (values.length > 0 && values[0] !== undefined) { // TODO: Log warning if undefined
      const value = values[0]
      if (f.type === 'int') {
        point.intField(f.out, value)
      } else if (f.type === 'float') {
        point.floatField(f.out, value)
      } else if (f.type === 'string') {
        point.stringField(f.out, value)
      }
    }
  })

  return point
}

export const createInfluxOutput = (config: InfluxConfig): Output => {
  const writeApi = createInfluxWriteApi(config.api)
  return {
    save: async (data, timestamp) => {
      const points = data.map(d => toInfluxPoint(d, config.bindings), timestamp)
      logger.log(`Writing InfluxDB point(s): ${points.length}`)
      // writeApi.writePoints(points) // TODO: Enable this!
    }
  }
}
