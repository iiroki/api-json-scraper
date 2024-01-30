# API JSON Scraper

A very simple JSON (REST/HTTP) API Scraper.

**Features:**
- Simple and easy to use!
- Multiple outputs:
  - InfluxDB
  - Time Series Platform (my own creation :D)
- Various API configuration options:
  - URL
  - HTTP Method
  - Headers
  - Query Parameters
  - Body
  - Replace configuration values with environment variables
- API request scheduling:
  - Run in intervals
  - Cron scheduling
  - Run on startup
- API response -> InfluxDB bindings:
  - Measurement
  - Timestamp
  - Tags
  - Fields
- Duplicate response filtering -> Only changed values are sent to outputs.
- Supports object and array responses.
- Fly.io deployment template with `Dockerfile`.

## Quickstart

### Development

1. Install npm dependencies:
    ```
    npm i
    ```

2. Fill the required configuration described in [Configuration](#configuration).

3. Start the application in development mode with `nodemon`:
    ```
    npm run dev
    ```

### Deployment

The application has a deployment template in order to deploy the application to [Fly.io](https://fly.io/).

1. Launch new Fly app:
    ```
    flyctl launch
    ```

2. Set the required InfluxDB configuration with env variables (see [InfluxDB](#influxdb])):
    ```
    flyctl secrets set <key>=<value> <key>=<value> ...
    ```

3. Configure API Scraper with the JSON configuration file (see [API Scraper](#api-scraper)).

4. Deploy the application:
    ```
    flyctl deploy
    ```

## Configuration

The configuration is divided into two parts:
- InfluxDB configuration with env variables
- API Scraper configuration with a JSON file with env variable replacements

### InfluxDB

InfluxDB configuration is handled with env variables.

| Env variable | Description | Required |
| ----- | ----- | :-----: |
| `INFLUX_URL` | InfluxDB URL | &check; |
| `INFLUX_TOKEN` | InfluxDB API token | &check; |
| `INFLUX_BUCKET` | InfluxDB bucket | &check; |
| `INFLUX_ORG` | InfluxDB organization | &check; |
| `INFLUX_BATCH_SIZE` | InfluxDB batch size (default: `10`) | - |
| `INFLUX_FLUSH_INTERVAL_MS` | InfluxDB flush interval in milliseconds (default: `60 * 1000`) | - |
| `INFLUX_GZIP_THRESHOLD` | InfluxDB gzip threshold | - |

### API Scraper

API Scraper configuration is handled with a JSON file.
By default, the file path is `config.json`, but it can be changed with the `SCRAPER_CONFIG_PATH` env variable.

The JSON configuration consists of an array of API Scraper configurations.

**API configuration:**
| Key | Description | Type | Required |
| ----- | ----- | ----- | :-----: |
| `name` | Display name of the API | `string` | - |
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
- `headers` and `query` support env variable replacements with `$<ENV_KEY>`, which can be used to read values from env variables.

#### Example

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

**As JSON configuration:**
```json
[
  {
    "name": "OpenWeather",
    "url": "https://api.openweathermap.org/data/2.5/weather",
    "query": {
      "appid": "$OPENWEATHER_APPID",
      "lat": "61.4509034",
      "lon": "23.8514239",
      "units": "metric"
    },
    "requestCronSchedule": "* * * * *",
    "requestOnStartup": true,
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
]
```

Example OpenWeather API response (some fields omitted):
```json
{
  ...
  "main": {
    "temp": -2.84,
    "feels_like": -7,
    "temp_min": -3.18,
    "temp_max": -2.01,
    "pressure": 994,
    "humidity": 78
  },
  ...
  "wind": {
    "speed": 3.09,
    "deg": 300
  },
  ...
  "name": "Example-Location",
  ...
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
