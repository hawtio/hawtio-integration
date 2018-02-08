/// <reference path="loggers.component.ts"/>
/// <reference path="logger.ts"/>

describe("LoggersService", function() {

  let jolokiaService: jasmine.SpyObj<JVM.JolokiaService>;
  let loggersService: SpringBoot.LoggersService;
  let $q: ng.IQService;
  let $rootScope: ng.IRootScopeService;

  beforeEach(inject(function(_$q_, _$rootScope_) {
    jolokiaService = jasmine.createSpyObj('jolokiaService', ['getAttribute', 'execute']);
    loggersService = new SpringBoot.LoggersService(jolokiaService);
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  describe("getLoggerConfiguration()", function() {

    it("should return logger configuration", function(done) {
      // given
      let levels = [ "INFO", "ERROR", "WARN", "DEBUG", "TRACE", "OFF" ];
      jolokiaService.getAttribute.and.returnValue($q.resolve({
        levels: levels,
        loggers: {
          "org": {
            configuredLevel: null,
            effectiveLevel: "INFO"
          },
          "org.foo": {
            configuredLevel: "WARN",
            effectiveLevel: "WARN"
          }
        }
      }));

      let expectedLogConfiguration: SpringBoot.LoggerConfiguration = {
        levels: levels,
        loggers: [
          {
            name: "org",
            configuredLevel: "INFO",
            effectiveLevel: "INFO"
          },
          {
            name: "org.foo",
            configuredLevel: "WARN",
            effectiveLevel: "WARN"
          }
        ]
      }

      // when
      loggersService.getLoggerConfiguration()
        .then(logConfiguration => {
          // then
          expect(logConfiguration).toEqual(expectedLogConfiguration);
          done();
        });
      $rootScope.$apply();
    });
  });

  describe("setLoggerLevel()", function() {

    it("should set the configured logger level", function(done) {
      // given
      let logger = {
        name: "org.foo",
        effectiveLevel: "INFO",
        configuredLevel: "TRACE"
      }

      // when
      loggersService.setLoggerLevel(logger);

      // then
      expect(jolokiaService.execute).toHaveBeenCalledWith(SpringBoot.jmxDomain, 'setLogLevel', 'org.foo', 'TRACE');
      done();
    });
  });
});
