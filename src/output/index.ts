import { createInfluxOutput } from './influx'
import { Output, OutputConfig } from '../model'

export const createOutputs = (config: OutputConfig): Output[] => {
  const outputs: Output[] = []

  // Time Series Platform
  if (config.tsp) {
    // TODO
    console.warn('Time Series Platform not implemented')
  }

  // InfluxDB
  if (config.influx) {
    outputs.push(createInfluxOutput(config.influx))
  }

  return outputs
}
