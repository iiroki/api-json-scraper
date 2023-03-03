import { readConfig } from './config'
import { createInfluxWriteApi, toInfluxPoint } from './influx'
import { ApiScraper } from './scraper'

const config = readConfig()
const influxWriteApi = createInfluxWriteApi(config.influx)

console.log(`Initializing ${config.scrapers.length} API Scraper(s)...`)

// Setup API Scrapers
for (const c of config.scrapers) {
  const scraper = new ApiScraper(c)

  // API Scraper request handler
  const handleRequest = async () => {
    const response = await scraper.request()
    if (response) {
      const point = toInfluxPoint(response, c.bindings)
      console.log(`[${scraper.name}] Writing InfluxDB Point: ${point}`)
      influxWriteApi.writePoint(point)
    }
  }

  // Perform an API request right away and in intervals after that.
  handleRequest()
  setInterval(async () => await handleRequest(), c.requestIntervalMs)
}

console.log('API Scraper(s) initialized, starting...')
