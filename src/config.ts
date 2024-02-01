import { readFileSync } from 'node:fs'
import dotenv from 'dotenv'
import { z } from 'zod'
import { ScraperConfig, Config, InfluxApiConfig, InfluxBindingConfig, TspConfig, TspBindingConfig, TspBindingTagConfig } from './model'
import { replacePropertiesFromEnv } from './util'

dotenv.config()
const SCAPER_CONFIG_PATH = process.env.SCAPER_CONFIG_PATH ?? 'config.json' // Default path

const zScraperConfigValidator: z.ZodType<ScraperConfig> = z.object({
  id: z.string(),
  url: z.string(),
  method: z.union([z.literal('GET'), z.literal('POST')]).optional(),
  headers: z.record(z.string()).optional(),
  query: z.record(z.string()).optional(),
  body: z.any(),
  requestIntervalMs: z.number().optional(),
  requestCronSchedule: z.string().optional(),
  requestOnStartup: z.boolean().optional(),
  filterDuplicateValues: z.boolean().optional()
})

const zTspBindingTagConfig: z.ZodType<TspBindingTagConfig> = z.object({
  slug: z.string(),
  value: z.string(),
  timestamp: z.string().optional()
})

const zTspBindingConfig: z.ZodType<TspBindingConfig> = z.object({
  id: z.string(),
  root: z.string().optional(),
  tags: zTspBindingTagConfig.array().optional()
})

const zTspConfigValidator: z.ZodType<TspConfig> = z.object({
  url: z.string(),
  apiKeyHeader: z.string().optional(),
  apiKey: z.string(),
  bindings: zTspBindingConfig.array().optional()
})

const zInfluxApiConfigValidator: z.ZodType<InfluxApiConfig> = z.object({
  url: z.string(),
  token: z.string(),
  bucket: z.string(),
  org: z.string(),
  batchSize: z.number().optional().default(10),
  flushIntervalMs: z.number().optional().default(60 * 1000),
  gzipThreshold: z.number().optional()
})

const zInfluxBindingConfigValidator: z.ZodType<InfluxBindingConfig> = z.object({
  measurement: z.string(),
  timestamp: z.object({
    key: z.string(),
    type: z.union([z.literal('string'), z.literal('number')])
  }).optional(),
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

const zConfigValidator: z.ZodType<Config> = z.object({
  scrapers: zScraperConfigValidator.array().nonempty(),
  outputs: z.object({
    influx: z.object({
      api: zInfluxApiConfigValidator,
      bindings: zInfluxBindingConfigValidator
    }).optional(),
    tsp: zTspConfigValidator.optional()
  })
})

export const readConfig = (): Config => {
  // Read API scraper config from the JSON file and replace the specified values from env.
  const file = readFileSync(SCAPER_CONFIG_PATH).toString()
  const configRaw: object = JSON.parse(file)
  replacePropertiesFromEnv(configRaw)
  return zConfigValidator.parse(configRaw)
}
