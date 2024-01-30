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
  readonly timestamp?: {
    readonly key?: string
    readonly type?: 'string' | 'number'
  }
  readonly tags: TagBindingConfig[]
  readonly fields: FieldBindingConfig[]
}

export interface TspConfig {
  // TODO
}

export interface Config {
  readonly scrapers: ScraperConfig[]
  readonly outputs: OutputConfig
}

export interface Output {
  readonly save: (data: object[], timestamp?: Date) => Promise<void>
}

export interface Logger {
  readonly log: (...args: any[]) => void
}
