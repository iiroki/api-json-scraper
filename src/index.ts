import cron from 'node-cron'
import { readConfig } from './config'
import { createInfluxWriteApi, toInfluxPoint } from './influx'
import { ApiScraper } from './scraper'

const config = readConfig()
const influxWriteApi = createInfluxWriteApi(config.influx)

console.log(`Initializing ${config.scrapers.length} API Scraper(s)...`)

// Setup API Scrapers
for (const c of config.scrapers) {
  const scraper = new ApiScraper(c)
  const logWithName = (...args: any[]) => console.log(`[${scraper.name}]`, ...args)

  // API Scraper request handler
  const handleRequest = async () => {
    const response = await scraper.request()
    if (response) {
      const point = toInfluxPoint(response, c.bindings)
      logWithName(`Writing InfluxDB Point: ${point}`)
      influxWriteApi.writePoint(point)
    }
  }

  // Perform an API request right away if needed.
  if (c.requestOnStartup) {
    handleRequest()
  }

  // Initialize API request interval
  if (c.requestIntervalMs) {
    setInterval(async () => await handleRequest(), c.requestIntervalMs)
    logWithName(`Initialized API request with interval: ${c.requestIntervalMs} ms`)
  }

  // Initialize API request cron schedule
  if (c.requestCronSchedule) {
    cron.schedule(c.requestCronSchedule, async () => await handleRequest())
    logWithName(`Initialized API request with cron schedule: ${c.requestCronSchedule}`)
  }
}

console.log('API Scraper(s) initialized, starting...')
