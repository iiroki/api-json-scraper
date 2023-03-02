import { readConfig } from './config'
import { transform } from './influx'
import { ApiScraper } from './scraper'

const config = readConfig()

console.log(`Initializing ${config.scrapers.length} API Scrapers...`)
for (const c of config.scrapers) {
  const scraper = new ApiScraper(c)
  setInterval(async () => {
    const response = await scraper.request()
    console.log(`[${c.name ?? c.url}] API Scraper response:`, response)
    const point = transform(response, c.bindings)
    console.log('InfluxDB Point:', point)
  }, c.requestIntervalMs)
}
