/// <reference path="spring-boot.service.ts"/>

describe("SpringBootService", function() {

  const healthTab = new Nav.HawtioTab('Health', '/spring-boot/health');
  const loggersTab = new Nav.HawtioTab('Loggers', '/spring-boot/loggers');
  const traceTab = new Nav.HawtioTab('Trace', '/spring-boot/trace');
  
  let $q: ng.IQService;
  let $rootScope: ng.IRootScopeService;
  let treeService: jasmine.SpyObj<Jmx.TreeService>;
  let springBootService: SpringBoot.SpringBootService;

  beforeEach(inject(function(_$q_, _$rootScope_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    treeService = jasmine.createSpyObj('treeService', ['treeContainsDomainAndProperties']);
    springBootService = new SpringBoot.SpringBootService($q, treeService);
  }));

  describe("getTabs()", function() {

    it("should return all tabs", function(done) {
      // given
      treeService.treeContainsDomainAndProperties.and.returnValues(
        $q.resolve(true), $q.resolve(true), $q.resolve(true));
      // when
      springBootService.getTabs()
        .then(tabs => {
          // then
          expect(tabs[0]).toEqual(healthTab);
          expect(tabs[1]).toEqual(loggersTab);
          expect(tabs[2]).toEqual(traceTab);
          done();
        });
      $rootScope.$apply();
    });

    it("should return two tabs", function(done) {
      // given
      treeService.treeContainsDomainAndProperties.and.returnValues(
        $q.resolve(true), $q.resolve(false), $q.resolve(true));
      // when
      springBootService.getTabs()
        .then(tabs => {
          // then
          expect(tabs[0]).toEqual(healthTab);
          expect(tabs[1]).toEqual(traceTab);
          done();
        });
      $rootScope.$apply();
    });

    it("should return one tab", function(done) {
      // given
      treeService.treeContainsDomainAndProperties.and.returnValues(
        $q.resolve(false), $q.resolve(false), $q.resolve(true));
      // when
      springBootService.getTabs()
        .then(tabs => {
          // then
          expect(tabs[0]).toEqual(traceTab);
          done();
        });
      $rootScope.$apply();
    });

    it("should return zero tabs", function(done) {
      // given
      treeService.treeContainsDomainAndProperties.and.returnValues(
        $q.resolve(false), $q.resolve(false), $q.resolve(false));
      // when
      springBootService.getTabs()
        .then(tabs => {
          // then
          expect(tabs.length).toBe(0);
          done();
        });
      $rootScope.$apply();
    });
  });
});
