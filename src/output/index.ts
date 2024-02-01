import { createInfluxOutput } from './influx'
import { createTspOutput } from './tsp'
import { Output, OutputConfig } from '../model'

export const createOutputs = (config: OutputConfig): Output[] => {
  const outputs: Output[] = []

  // Time Series Platform
  if (config.tsp) {
    outputs.push(createTspOutput(config.tsp))
  }

  // InfluxDB
  if (config.influx) {
    outputs.push(createInfluxOutput(config.influx))
  }

  return outputs
}
