import cron from 'node-cron'
import { readConfig } from './config'
import { Output } from './model'
import { createOutputs } from './output'
import { ApiScraper } from './scraper'
import { areEqualSimple, createLogger } from './util'

const config = readConfig()
const outputs: Output[] = createOutputs(config.outputs)

console.log(`Initializing ${config.scrapers.length} API Scraper(s)...`)

// Setup API Scrapers
for (const c of config.scrapers) {
  const scraper = new ApiScraper(c)
  const logger = createLogger(scraper.name)

  // API Scraper request handler
  let lastResponse: any
  const handleRequest = async () => {
    const response = await scraper.request()
    const now = new Date() // API response timestamp

    if (response) {
      if (c.filterDuplicateValues && areEqualSimple(response, lastResponse)) {
        logger.info('Received the same response as the previous one, skipping...')
        return
      }

      lastResponse = response // Store the response for filtering duplicate values
      Promise.all(outputs.map(o => o.save(c.id, Array.isArray(response) ? response : [response], now)))
    }
  }

  // Perform an API request right away if needed.
  if (c.requestOnStartup) {
    handleRequest()
  }

  // Initialize API request interval
  if (c.requestIntervalMs) {
    setInterval(async () => await handleRequest(), c.requestIntervalMs)
    logger.info(`Initialized API request with interval: ${c.requestIntervalMs} ms`)
  }

  // Initialize API request cron schedule
  if (c.requestCronSchedule) {
    cron.schedule(c.requestCronSchedule, async () => await handleRequest())
    logger.info(`Initialized API request with cron schedule: ${c.requestCronSchedule}`)
  }
}

console.log(`${config.scrapers.length} API Scraper(s) initialized, starting...`)
