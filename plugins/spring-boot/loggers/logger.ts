namespace SpringBoot {

  export interface LoggerConfiguration {
    levels: string[],
    loggers: Logger[]
  }

  export interface Logger {
    name: string,
    configuredLevel: string,
    effectiveLevel: string
  }
}
