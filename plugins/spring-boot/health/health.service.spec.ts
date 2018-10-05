/// <reference path="health.service.ts"/>
/// <reference path="health.ts"/>

describe("HealthService", function () {

  let jolokiaService: jasmine.SpyObj<JVM.JolokiaService>;
  let humanizeService: Core.HumanizeService;
  let healthService: SpringBoot.HealthService;
  let $q: ng.IQService;
  let $rootScope: ng.IRootScopeService;

  beforeEach(inject(function (_$q_, _$rootScope_) {
    jolokiaService = jasmine.createSpyObj('jolokiaService', ['getAttribute']);
    humanizeService = new Core.HumanizeService();
    healthService = new SpringBoot.HealthService(jolokiaService, humanizeService);
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  describe("getHealth()", function () {

    it("should return Health object with global status UP and no detail items", function (done) {
      // given
      jolokiaService.getAttribute.and.returnValue($q.resolve({ status: 'UP' }));
      // when
      healthService.getHealth()
        .then(health => {
          // then
          expect(health.global.title).toBe('Overall status: UP');
          expect(health.global.iconClass).toBe('pficon pficon-ok');
          expect(health.details.length).toBe(0);
          done();
        });
      $rootScope.$apply();
    });

    it("should return Health object with global status DOWN and 3 detail items", function (done) {
      // given
      jolokiaService.getAttribute.and.returnValue($q.resolve({
        diskSpace: {
          total: 220138139648,
          threshold: 10485760,
          free: 117575626752,
          status: "UP"
        },
        db: {
          activemqLockerDataSource: {
            database: "H2",
            hello: 1,
            status: "DOWN"
          },
          activemqPersistenceDataSource: {
            database: "H2",
            hello: 1,
            status: "OUT_OF_SERVICE"
          },
          status: "DOWN"
        },
        camel: {
          contextStatus: "Started",
          name: "SampleCamel",
          version: "2.19.2",
          status: "UNKNOWN"
        },
        status: "DOWN"
      }));
      // when
      healthService.getHealth()
        .then(health => {
          // then
          expect(health.global.title).toBe('Overall status: DOWN');
          expect(health.global.iconClass).toBe('pficon pficon-error-circle-o');
          expect(health.details[0].title).toBe('Camel');
          expect(health.details[0].iconClass).toBe('pficon pficon-help');
          expect(/Status: .*UNKNOWN/.test(health.details[0].info[0])).toBe(true);
          expect(/Context status: .*Started/.test(health.details[0].info[1])).toBe(true);
          expect(/Name: .*SampleCamel/.test(health.details[0].info[2])).toBe(true);
          expect(/Version: .*2.19.2/.test(health.details[0].info[3])).toBe(true);
          expect(health.details[1].title).toBe('Db');
          expect(health.details[1].iconClass).toBe('pficon pficon-error-circle-o');
          expect(/Status: .*DOWN/.test(health.details[1].info[0])).toBe(true);
          expect(/Activemq locker data source.*Status: .*DOWN.*Database: .*H2.*Hello: .*1/.test(health.details[1].info[1])).toBe(true);
          expect(/Activemq persistence data source.*Status: .*OUT_OF_SERVICE.*Database: .*H2.*Hello: .*1/.test(health.details[1].info[2])).toBe(true);
          expect(health.details[2].title).toBe('Disk space');
          expect(health.details[2].iconClass).toBe('pficon pficon-ok');
          expect(/Status: .*UP/.test(health.details[2].info[0])).toBe(true);
          expect(/Free: .*117575626752/.test(health.details[2].info[1])).toBe(true);
          expect(/Threshold: .*10485760/.test(health.details[2].info[2])).toBe(true);
          expect(/Total: .*220138139648/.test(health.details[2].info[3])).toBe(true);
          done();
        });
      $rootScope.$apply();
    });

    describe("getIconClass()", function () {

      it("should return icon CSS class for each health status", function () {
        expect(healthService.getIconClass('UP')).toEqual('pficon pficon-ok');
        expect(healthService.getIconClass('DOWN')).toEqual('pficon pficon-error-circle-o');
        expect(healthService.getIconClass('OUT_OF_SERVICE')).toEqual('pficon pficon-warning-triangle-o');
        expect(healthService.getIconClass('UNKNOWN')).toEqual('pficon pficon-help');
        expect(healthService.getIconClass('CUSTOM')).toEqual('pficon pficon-info');
      });

    });

  });

});
