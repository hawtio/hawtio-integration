/// <reference path="loggers.component.ts"/>
/// <reference path="loggers.service.ts"/>

describe("LoggersController", function() {

  let loggersService: jasmine.SpyObj<SpringBoot.LoggersService>;
  let loggersController: SpringBoot.LoggersController;

  let $q: ng.IQService;
  let $rootScope: ng.IRootScopeService;

  beforeEach(inject(function(_$q_, _$rootScope_) {
    loggersService = jasmine.createSpyObj('loggersService', ['getLoggerConfiguration', 'setLoggerLevel']);
    loggersController = new SpringBoot.LoggersController(loggersService);
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  describe("$onInit()", function() {

    it("should load logger data", function() {
      // given
      let levels = ['INFO', 'ERROR', 'WARN'];
      let loggers: SpringBoot.Logger[] = [
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
      ];
      let loggerConfiguration: SpringBoot.LoggerConfiguration = {
        levels: levels,
        loggers: loggers
      }
      loggersService.getLoggerConfiguration.and.returnValue($q.resolve(loggerConfiguration));

      // when
      loggersController.$onInit();
      $rootScope.$apply();

      // then
      expect(loggersController.loggerLevels).toBe(levels);
      expect(loggersController.loggers).toBe(loggers);
      expect(loggersController.tableItems).toBe(loggers);
      expect(loggersController.loading).toBe(false);
    });
  });

  describe("setLoggerLevel()", function() {

    it("sets the logger level", function() {
      // given
      let logger: SpringBoot.Logger = {
        name: "org.foo",
        configuredLevel: "TRACE",
        effectiveLevel: "WARN"
      }
      loggersService.setLoggerLevel.and.returnValue($q.resolve({}));

      // when
      loggersController.setLoggerLevel(logger);

      // then
      expect(loggersService.setLoggerLevel).toHaveBeenCalledWith(logger);
    });
  });

  describe("applyFilters()", function() {

    it("returns filtered results for matching logger name", function () {
      //given
      let loggerA: SpringBoot.Logger = {
        name: "org",
        configuredLevel: "INFO",
        effectiveLevel: "INFO"
      };

      let loggerB: SpringBoot.Logger = {
        name: "org.foo",
        configuredLevel: "ERROR",
        effectiveLevel: "ERROR"
      };

      loggersController.loggers = [loggerA, loggerB];

      // when
      loggersController.applyFilters([{id: 'name', value: 'foo'}]);

      // then
      expect(loggersController.tableItems).toEqual([loggerB]);
    });

    it("returns filtered results for matching logger level", function () {
      //given
      let loggerA: SpringBoot.Logger = {
        name: "org",
        configuredLevel: "INFO",
        effectiveLevel: "INFO"
      };

      let loggerB: SpringBoot.Logger = {
        name: "org.foo",
        configuredLevel: "ERROR",
        effectiveLevel: "ERROR"
      };

      loggersController.loggers = [loggerA, loggerB];

      // when
      loggersController.applyFilters([{id: 'level', value: 'INFO'}]);

      // then
      expect(loggersController.tableItems).toEqual([loggerA]);
    });

    it("returns filtered results for matching logger name and level", function () {
      //given
      let loggerA: SpringBoot.Logger = {
        name: "org",
        configuredLevel: "INFO",
        effectiveLevel: "INFO"
      };

      let loggerB: SpringBoot.Logger = {
        name: "org.foo",
        configuredLevel: "ERROR",
        effectiveLevel: "ERROR"
      };

      loggersController.loggers = [loggerA, loggerB];

      // when
      loggersController.applyFilters([{id: 'name', value: 'org'},{id: 'level', value: 'ERROR'}]);

      // then
      expect(loggersController.tableItems).toEqual([loggerB]);
    });
  });
});
