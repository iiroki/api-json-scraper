import axios, { AxiosRequestConfig } from 'axios'
import { ApiConfig, ApiMethod } from './model'

export class ApiScraper {
  private readonly _url: string
  private readonly _method: ApiMethod
  private readonly _headers: Record<string, string>
  private readonly _body: any

  constructor(config: ApiConfig) {
    this._method = config.method ?? 'GET'
    this._headers = config.headers ?? {}
    this._body = config.body ?? {}

    let params: URLSearchParams | null = null
    if (config.query) {
      params = new URLSearchParams()
      for (const [key, value] of Object.entries(config.query)) {
        params.append(key, value)
      }
    }

    this._url = params ? `${config.url}?${params.toString()}` : config.url
  }

  async request(): Promise<any> {
    const config: AxiosRequestConfig = { headers: this._headers }
    switch (this._method) {
      case 'GET': return (await axios.get(this._url, config)).data
      case 'POST': return (await axios.post(this._url, this._body, config)).data
      default: throw new Error(`Unknown method: ${this._method}`)
    }
  }
}
