/// <reference path="logger.ts"/>
/// <reference path="../common/endpoint-mbean.ts"/>

namespace SpringBoot {

  export class LoggersService {

    constructor(private jolokiaService: JVM.JolokiaService, private springBootService: SpringBootService) {
      'ngInject';
    }

    getLoggerConfiguration(): ng.IPromise<LoggerConfiguration> {
      const mbean: EndpointMBean = this.springBootService.getEndpointMBean(['Loggers'], ['loggers'])
      return this.jolokiaService.execute(mbean.objectName, mbean.operation)
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
      const mbean: EndpointMBean = this.springBootService.getEndpointMBean(['Loggers'], ['configureLogLevel'])
      return this.jolokiaService.execute(mbean.objectName, mbean.operation, logger.name, logger.configuredLevel);
    }
  }
}
