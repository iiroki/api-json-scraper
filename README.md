# API JSON Scraper

A very simple JSON (REST/HTTP) API Scraper.

**Features:**
- Simple and easy to use!
- Multiple outputs:
  - [Time Series Platform](https://github.com/iiroki/time-series-platform) (my own creation :D)
  - [InfluxDB](https://www.influxdata.com/)
- Various configuration options:
  - API
    - URL
    - HTTP method
    - Headers
    - Query parameters
    - Body
  - Output
    - Define bindings/transforms per output
  - Replace any configuration values with environment variables!
- API request scheduling:
  - Run in intervals
  - Cron scheduling
  - Run on startup
- Duplicate response filtering -> Only changed values are sent to outputs.
- Supports object and array responses.
- Fly.io deployment template with `Dockerfile`.

## Quickstart

### Development

1. Install npm dependencies:
    ```
    npm i
    ```

1. Fill the required configuration described in [Configuration](#configuration).

1. Start the application in development mode with `nodemon`:
    ```
    npm run dev
    ```

### Deployment

The application has a deployment template in order to deploy the application to [Fly.io](https://fly.io/).

1. Launch new Fly app:
    ```
    flyctl launch
    ```

1. Fill the required configuration described in [Configuration](#configuration).

1. Set the secrets defined in configuration with env variables:
    ```
    flyctl secrets set <key>=<value> <key>=<value> ...
    ```

1. Deploy the application:
    ```
    flyctl deploy
    ```

## Configuration

The application configuration is handled with a JSON file.
By default, the file path is `config.json`, but it can be changed with the `CONFIG_PATH` env variable.

The configuration is divided into two parts:
- API Scraper configuration
- Output configuration

```json
{
  "scrapers": [],
  "outputs": {}
}
```

The configuration also supports environment variable replacements with `$` prefix (example: `$API_KEY`).

**Example configuration:**

This configuration can be used to request data from two APIs, Pörssisähkö and OpenWeatherMap,
and send the data into Time Series Platform.

```json
{
  {
    "scrapers": [
      {
        "id": "porssisahko",
        "url": "https://api.porssisahko.net/v1/latest-prices.json",
        "requestCronSchedule": "0 * * * *"
      },
      {
        "id": "weather",
        "url": "https://api.openweathermap.org/data/2.5/weather",
        "query": {
          "appid": "$OPENWEATHER_API_KEY",
          "units": "metric",
          "lon": "23.726347",
          "lat": "61.4938809"
        },
        "requestCronSchedule": "*/10 * * * *"
      }
    ],
    "outputs": {
      "tsp": {
        "url": "$TSP_URL",
        "apiKey": "$TSP_API_KEY",
        "bindings": [
          {
            "id": "porssisahko",
            "root": "prices",
            "measurements": [
              {
                "tag": "electricity_price",
                "value": "price",
                "timestamp": "startDate"
              }
            ]
          },
          {
            "id": "weather",
            "measurements": [
              {
                "tag": "temperature",
                "value": "main.temp"
              },
              {
                "tag": "humidity",
                "value": "main.humidity"
              },
              {
                "tag": "wind_speed",
                "value": "wind.speed"
              }
            ]
          }
        ]
      }
    }
  }
}
```

### Scrapers

`scrapers` is used to define the API scrapers that act as the data sources of the application.

`scrapers` constists of array of `Scraper` objects (`Scraper[]`).

```json
{
  "scrapers": []
}
```

**`Scraper`:**
| Key | Description | Type | Required |
| ----- | ----- | ----- | :-----: |
| `id` | ID of the API scraper (also used by the outputs) | `string` | &check; |
| `url` | API URL | `string` | &check; |
| `method` | Request HTTP method (default: `GET`) | `GET`, `POST` | - |
| `headers` | Request HTTP headers | `Record<string, string>` | - |
| `query` | Request Query parameters | `Record<string, string>` | - |
| `body` | Request HTTP body | `any` | - |
| `requestIntervalMs` | Request interval in milliseconds | `number` | - |
| `requestCronSchedule` | Cron expression for request scheduling | `string` | - |
| `requestOnStartup` | Perform the API request on application startup | `boolean` | - |
| `filterDuplicateValues` | Whether adjacent duplicate values should be sent to InfluxDB | `boolean` | - |
| `bindings` | API response -> InfluxDB bindings | See InfluxDB bindings below! | &check; |

### Outputs

`outputs` is used to define where the data produced by the API scrapers should be sent.

```json
{
  "outputs": {
    "tsp": {},
    "influx": {}
  }
}
```

#### Time Series Platform

**`TspConfig`:**
| Key | Description | Type | Required |
| ----- | ----- | ----- | :-----: |
| `url` | Time Series Platform URL | `string` | &check; |
| `apiKey` | API key | `string` | &check; |
| `apiKey` | API key header (if not default) | `string` | - |
| `bindings` | API -> TSP bindings | `TspBindingConfig[]` | - |

**`TspBindingConfig`:**
| Key | Description | Type | Required |
| ----- | ----- | ----- | :-----: |
| `id` | ID of the API scraper | `string` | &check; |
| `root` | Root object of the API response that should be transformed | `string` | - |
| `measurements` | API -> TSP measurement bindings | `TspBindingMeasurementConfig[]` | - |

**`TspBindingMeasurementConfig`:**
| Key | Description | Type | Required |
| ----- | ----- | ----- | :-----: |
| `tag` | Measurement tag slug | `string` | &check; |
| `location` | Measurement location slug | `string` | - |
| `value` | Value property of the API response | `string` | &check; |
| `timestamp` | Timestamp property of the API response | `string` | - |

#### InfluxDB

**!!! NOTE !!!**
InfluxDB integration is somewhat broken at the moment after adding support for multiple outputs (will be fixed later).

**`InfluxConfig`:**
| Key | Type | Required |
| ----- | ----- | ----- | :-----: |
| `api` | `InfluxApiConfig` | &check; |
| `bindings` | `InfluxBindingConfig` | &check; |

**`InfluxApiConfig`:**
| Key | Description | Type | Required |
| ----- | ----- | ----- | :-----: |
| `url` | InfluxDB URL | `string` | &check; |
| `token` | InfluxDB API token | `string` | &check; |
| `bucket` | InfluxDB bucket | `string` | &check; |
| `org` | InfluxDB organization | `string` | &check; |
| `batchSize` | InfluxDB batch size (default: `10`) | `number` | - |
| `flushIntervalMs` | InfluxDB flush interval in milliseconds (default: `60 * 1000`) | `number` | - |
| `gzipThreshold` | InfluxDB gzip threshold | `number` | - |

**InfluxDB binding configuration:**
| Key | Description | Type | Required |
| ----- | ----- | ----- | :-----: |
| `measurement` | InfluxDB measurement | `string` | &check; |
| `timestamp` | Timestamp of the measurement | `{ key: string, type: 'string' \| 'number' }` | - |
| `tags` | InfluxDB tag bindings (see below!) | `{ in?: string, out: string, value?: string }` | &check; |
| `fields` | InfluxDB field bindings (see below!) | `{ in: string, out: string, type: 'int' \| 'float' \| 'string' }` | &check; |

InfluxDB tag/field bindings are used to map the values from API responses into tags/fields:
- `in`: API response key of the value with `.` as separator for nested objects (Example: `main.temp`)
- `out`: InfluxDB output tag/field name
- `value`: Static value
- `type`: InfluxDB field type

**NOTES:**
- If no `timestamp` InfluxDB binding is specified, the timestamp is set to the current time.

**InfluxDB example:**

The example uses [OpenWeather API](https://openweathermap.org/api) to fetch weather information and write the results to InfluxDB:
- Read OpenWeather API key from `OPENWEATHER_APPID` env variable
- Insert API key and parameters as query parameters
- Perform API requests every minute with cron scheduling
- Perform API request on the application startup
- InfluxDB bindings:
  - Measurement: `weather`
  - Tags:
    - Static: `provider` and `url`
    - From API response: `name` -> `location`
  - Fields From API response:
    - `main.temp` -> `temperatureC` (float)
    - `main.feels_like` -> `feelsLikeC` (float)
    - `main.humidity` -> `humidityRh` (float)
    - `wind.speed` -> `windSpeedMs` (float)

**JSON configuration:**
```json
{
  "bindings": {
    "measurement": "weather",
    "tags": [
      {
        "in": "name",
        "out": "location"
      },
      {
        "out": "provider",
        "value": "OpenWeather"
      }
    ],
    "fields": [
      {
        "in": "main.temp",
        "out": "temperatureC",
        "type": "float"
      },
      {
        "in": "main.feels_like",
        "out": "feelsLikeC",
        "type": "float"
      },
      {
        "in": "main.humidity",
        "out": "humidityRh",
        "type": "float"
      },
      {
        "in": "wind.speed",
        "out": "windSpeedMs",
        "type": "float"
      }
    ]
  }
}
```

Example OpenWeather API response (some fields omitted):
```json
{
  "main": {
    "temp": -2.84,
    "feels_like": -7,
    "temp_min": -3.18,
    "temp_max": -2.01,
    "pressure": 994,
    "humidity": 78
  },
  "wind": {
    "speed": 3.09,
    "deg": 300
  },
  "name": "Example-Location",
}
```

The example API response will be transformed into the following InfluxDB data point:
- Measurement: `weather`
- Timestamp: Time of the API request
- Tags:
  - `location` = `Example-Location`
  - `provider` = `OpenWeather`
- Fields:
  - `temperatureC` = `-2.84`
  - `feelsLikeC` = `-7`
  - `humidityRh` = `78`
  - `windSpeedMs` = `3.09`
