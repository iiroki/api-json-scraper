import { readFileSync } from 'fs'
import { z } from 'zod'
import { ApiScraperConfig, Config, InfluxConfig } from './model'

const CONFIG_PATH = process.env.CONFIG_PATH ?? 'config.json' // Default path

const ApiScraperConfigValidator: z.ZodType<ApiScraperConfig> = z.object({
  name: z.string().optional(),
  url: z.string(),
  method: z.union([z.literal('GET'), z.literal('POST')]).optional(),
  headers: z.record(z.string()).optional(),
  query: z.record(z.string()).optional(),
  body: z.any(),
  requestIntervalMs: z.number(),
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
  scrapers: ApiScraperConfigValidator.array()
})

export const readConfig = (): Config => {
  const json = JSON.parse(readFileSync(CONFIG_PATH).toString())
  return ConfigValidator.parse(json)
}
