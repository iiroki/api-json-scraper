export type FieldType = 'int' | 'float' | 'string'

export interface TagBindingConfig {
  readonly in?: string
  readonly out: string
  readonly value?: string
}

export interface FieldBindingConfig {
  readonly in: string
  readonly out: string
  readonly type: FieldType
}

export type ApiMethod = 'GET' | 'POST'

export interface ApiConfig {
  readonly name?: string
  readonly url: string
  readonly method?: ApiMethod
  readonly headers?: Record<string, string>
  readonly query?: Record<string, string>
  readonly body?: any
}

export interface InfluxConfig {
  readonly url: string
  readonly token: string
  readonly bucket: string
  readonly org: string
  readonly batchSize?: number
  readonly flushIntervalMs?: number
  readonly gzipThreshold?: number
}

export interface InfluxBindingConfig {
  readonly measurement: string
  readonly tags: TagBindingConfig[]
  readonly fields: FieldBindingConfig[]
}

export interface ScraperConfig extends ApiConfig {
  readonly requestIntervalMs?: number
  readonly requestCronSchedule?: string
  readonly requestOnStartup?: boolean
  readonly bindings: InfluxBindingConfig
}

export interface Config {
  readonly influx: InfluxConfig
  readonly scrapers: ScraperConfig[]
}
