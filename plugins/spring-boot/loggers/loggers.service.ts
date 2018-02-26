/// <reference path="logger.ts"/>

namespace SpringBoot {

  export class LoggersService {

    constructor(private jolokiaService: JVM.JolokiaService) {
      'ngInject';
    }

    getLoggerConfiguration(): ng.IPromise<LoggerConfiguration> {
      return this.jolokiaService.getAttribute(loggersJmxDomain, 'Loggers')
        .then(data => {
          let loggers: Logger[] = [];

          angular.forEach(data.loggers, (loggerInfo, loggerName: string) => {
            let logger: Logger = {
              name: loggerName,
              configuredLevel: loggerInfo.configuredLevel == null ? loggerInfo.effectiveLevel : loggerInfo.configuredLevel,
              effectiveLevel: loggerInfo.effectiveLevel
            }
            loggers.push(logger);
          })

          let loggerConfiguration: LoggerConfiguration = {
            levels: data.levels,
            loggers: loggers
          }

          return loggerConfiguration;
        });
    }

    setLoggerLevel(logger: Logger): ng.IPromise<void> {
      return this.jolokiaService.execute(loggersJmxDomain, 'setLogLevel', logger.name, logger.configuredLevel);
    }
  }
}