/// <reference path="health.component.ts"/>
/// <reference path="health.ts"/>

describe("HealthService", function() {

  let jolokiaService: jasmine.SpyObj<JVM.JolokiaService>;
  let humanizeService: Core.HumanizeService;
  let healthService: SpringBoot.HealthService;
  let $q: ng.IQService;
  let $rootScope: ng.IRootScopeService;

  beforeEach(inject(function(_$q_, _$rootScope_) {
    jolokiaService = jasmine.createSpyObj('jolokiaService', ['getAttribute']);
    humanizeService = new Core.HumanizeService();
    healthService = new SpringBoot.HealthService(jolokiaService, humanizeService);
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  describe("getHealth()", function() {

    it("should return Health object with 'OUT OF SERVICE' status and no items", function(done) {
      // given
      jolokiaService.getAttribute.and.returnValue($q.resolve({status: "OUT_OF_SERVICE"}));
      // when
      healthService.getHealth()
        .then(health => {
          // then
          expect(health).toEqual(new SpringBoot.Health('OUT OF SERVICE', []));
          done();
        });
      $rootScope.$apply();
    });
  
    it("should return Health object with 'UP' status and two items", function(done) {
      // given
      jolokiaService.getAttribute.and.returnValue($q.resolve({
        camel: {contextStatus: "Started", name: "SampleCamel", version: "2.19.2", status: "UP"},
        diskSpace: {total: 220138139648, threshold: 10485760, free: 117575626752, status: "UP"},
        status: "UP"
      }));
      // when
      healthService.getHealth()
        .then(health => {
          // then
          expect(health).toEqual(new SpringBoot.Health('UP', [
            {title: "Camel", info: ["Context status: Started", "Name: SampleCamel", "Version: 2.19.2", "Status: UP"]},
            {title: "Disk space", info: ["Total: 220138139648", "Threshold: 10485760", "Free: 117575626752", "Status: UP"]}
          ]));
          done();
        });
      $rootScope.$apply();
    });

  });
   
});
