import { readFileSync } from 'node:fs'
import dotenv from 'dotenv'
import { z } from 'zod'
import { ScraperConfig, Config, InfluxConfig } from './model'

dotenv.config()
const SCAPER_CONFIG_PATH = process.env.SCAPER_CONFIG_PATH ?? 'config.json' // Default path

const ScraperConfigValidator: z.ZodType<ScraperConfig> = z.object({
  name: z.string().optional(),
  url: z.string(),
  method: z.union([z.literal('GET'), z.literal('POST')]).optional(),
  headers: z.record(z.string()).optional(),
  query: z.record(z.string()).optional(),
  body: z.any(),
  requestIntervalMs: z.number().optional(),
  requestCronSchedule: z.string().optional(),
  requestOnStartup: z.boolean().optional(),
  bindings: z.object({
    measurement: z.string(),
    tags: z.object({
      in: z.string().optional(),
      out: z.string(),
      value: z.string().optional()
    }).array(),
    fields: z.object({
      in: z.string(),
      out: z.string(),
      type: z.union([z.literal('int'), z.literal('float'), z.literal('string')])
    }).array()
  })
})

const InfluxConfigValidator: z.ZodType<InfluxConfig> = z.object({
  url: z.string(),
  token: z.string(),
  bucket: z.string(),
  org: z.string(),
  batchSize: z.number().optional(),
  flushIntervalMs: z.number().optional(),
  gzipThreshold: z.number().optional()
})

const ConfigValidator: z.ZodType<Config> = z.object({
  influx: InfluxConfigValidator,
  scrapers: ScraperConfigValidator.array()
})

const replaceValuesFromEnv = (obj: Record<string, string>): Record<string, string> => {
  const result: Record<string, string> = {}
  Object.entries(obj).forEach(e => {
    const [key, value] = e
    console.log('REPLACING:', key, value)

    // Read value from env, fallback to the original value.
    result[key] = value.startsWith('$')
      ? process.env[value.substring(1)] ?? value
      : value
  })

  return result
}

export const readConfig = (): Config => {
  const influxConfig: Partial<InfluxConfig> = {
    url: process.env.INFLUX_URL,
    token: process.env.INFLUX_TOKEN,
    bucket: process.env.INFLUX_BUCKET,
    org: process.env.INFLUX_ORG,
    batchSize: Number(process.env.INFLUX_BATCH_SIZE) || 10, // Default
    flushIntervalMs: Number(process.env.INFLUX_FLUSH_INTERVAL_MS) || 60 * 1000, // Default: 1 min
    gzipThreshold: Number(process.env.INFLUX_GZIP_THRESHOLD) || undefined
  }

  // Read API scraper config from the JSON file and replace the specified values from env.
  const scaperConfig: Partial<ScraperConfig>[] = JSON.parse(readFileSync(SCAPER_CONFIG_PATH).toString())
  z.any().array().parse(scaperConfig) // Throws if the config is not an array!
  const scraperConfigWithEnv: Partial<ScraperConfig>[] = scaperConfig.map(c => ({
    ...c,
    headers: c.headers ? replaceValuesFromEnv(c.headers) : undefined,
    query: c.query ? replaceValuesFromEnv(c.query) : undefined
  }))

  return ConfigValidator.parse({ influx: influxConfig, scrapers: scraperConfigWithEnv })
}
