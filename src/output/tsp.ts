import axios, { RawAxiosRequestHeaders } from 'axios'
import { get } from 'underscore'
import { Output, TspBindingConfig, TspConfig, TspMeasurementBatch, TspMeasurementData } from '../model'
import { createLogger } from '../util'

interface TspTransformer {
  readonly transform: (data: object[], timestamp?: Date) => TspMeasurementBatch[]
}

const logger = createLogger('Time Series Platform')

export const createTspTransformers = (config: Omit<TspBindingConfig, 'id'>): TspTransformer[] => {
  return (config.tags ?? []).map(t => ({
    transform: (data, apiTimestamp) => {
      const measurementMap = new Map<string, TspMeasurementBatch>()
      const insertMeasurement = (tag: string, measurement: TspMeasurementData) => {
        const existing = measurementMap.get(tag)
        if (existing) {
          existing.data.push(measurement)
        } else {
          measurementMap.set(
            tag,
            { tag, data: [measurement], versionTimestamp: (apiTimestamp ?? new Date()).toISOString() }
          )
        }
      }

      for (const item of data) {
        const root: unknown = config.root ? get(item, config.root.split('.')) : item
        const input = Array.isArray(root) ? root : [root]
        for (const i of input) {
          const value = Number(get(i, t.value.split('.')))
          let timestamp = apiTimestamp?.toISOString()
          if (t.timestamp) {
            const tsRaw: unknown = get(i, t.timestamp)
            if (tsRaw) {
              timestamp = typeof tsRaw === 'string' ? tsRaw : String(tsRaw)
            }
          }

          if (timestamp) {
            insertMeasurement(t.slug, { value, timestamp })
          }
        }
      }

      return [...measurementMap.values()]
    }
  }))
}

export const createTspOutput = ({ url, apiKey, apiKeyHeader, bindings }: TspConfig): Output => {
  const measurementUrl = `${url}/measurement`
  const apiKeyHeaders: RawAxiosRequestHeaders = { [apiKeyHeader ?? 'x-api-key']: apiKey }
  const transformerMap = new Map<string, TspTransformer[]>(
    (bindings ?? []).map(b => [b.id, createTspTransformers(b)])
  )

  if (transformerMap.size === 0) {
    logger.info('No transformers -> Disabled')
  }

  return {
    save: async (id, data, apiTimestamp) => {
      if (transformerMap.size === 0) {
        return
      }

      const start = performance.now()
      const transformers = transformerMap.get(id)
      if (!transformers) {
        return
      }

      const measurements = transformers.flatMap(t => t.transform(data, apiTimestamp))
      try {
        await axios.post(measurementUrl, measurements, { headers: apiKeyHeaders })
        logger.info([
          `Sent ${measurements.length} measurement batch(es)`,
          `(rows: ${measurements.flatMap(b => b.data).length} )`,
          `in ${Math.floor(performance.now() - start)} ms`
        ].join(' '))
      } catch (err) {
        logger.error('Could not send measurements to Time Series Platform:', err)
      }
    }
  }
}
