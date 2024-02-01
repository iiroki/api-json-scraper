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
  readonly id: string
  readonly url: string
  readonly method?: ApiMethod
  readonly headers?: Record<string, string>
  readonly query?: Record<string, string>
  readonly body?: any
}

export interface ScraperConfig extends ApiConfig {
  readonly requestIntervalMs?: number
  readonly requestCronSchedule?: string
  readonly requestOnStartup?: boolean
  readonly filterDuplicateValues?: boolean
}

export interface OutputConfig {
  readonly influx?: InfluxConfig
  readonly tsp?: TspConfig
}

export interface InfluxConfig {
  readonly api: InfluxApiConfig
  readonly bindings: InfluxBindingConfig
}

export interface InfluxApiConfig {
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
  readonly timestamp?: TimestampConfig
  readonly tags: TagBindingConfig[]
  readonly fields: FieldBindingConfig[]
}

export interface TspConfig {
  readonly url: string
  readonly apiKey: string
  readonly apiKeyHeader?: string
  readonly bindings?: TspBindingConfig[]
}

export interface TspBindingConfig {
  readonly id: string
  readonly root?: string
  readonly tags?: TspBindingTagConfig[]
}

export interface TspBindingTagConfig {
  readonly slug: string
  readonly value: string
  readonly timestamp?: string
}

export type TimestampConfig = {
  readonly key: string
  readonly type: 'string' | 'number'
}

export interface Config {
  readonly scrapers: ScraperConfig[]
  readonly outputs: OutputConfig
}

export interface Output {
  readonly save: (id: string, data: object[], timestamp?: Date) => Promise<void>
}

export interface Logger {
  readonly info: (...args: any[]) => void
  readonly error: (...args: any[]) => void
}

export type TspMeasurementBatch = {
  readonly tag: string
  readonly location?: string
  readonly data: TspMeasurementData[]
  readonly versionTimestamp?: string
}

export type TspMeasurementData = {
  readonly value: number
  readonly timestamp: string
}
