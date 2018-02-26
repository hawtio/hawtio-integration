namespace SpringBoot {

  export const loggersJmxDomain:string = "org.springframework.boot:type=Endpoint,name=loggersEndpoint";

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
