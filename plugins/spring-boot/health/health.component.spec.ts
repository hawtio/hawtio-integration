/// <reference path="health.component.ts"/>
/// <reference path="health.service.ts"/>

describe("HealthController", function () {

  let $interval;
  let healthService: jasmine.SpyObj<SpringBoot.HealthService>;
  let healthController: SpringBoot.HealthController;
  let $q: ng.IQService;
  let $rootScope: ng.IRootScopeService;

  beforeEach(inject(function (_$q_, _$rootScope_) {
    $interval = jasmine.createSpy('$interval');
    healthService = jasmine.createSpyObj('jolokiaService', ['getHealth']);
    healthController = new SpringBoot.HealthController($interval, healthService);
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  describe("$onInit()", function () {

    it("should load health data and start $interval", function () {
      // given
      const health = new SpringBoot.Health({ title: '', iconClass: '' }, []);
      healthService.getHealth.and.returnValue($q.resolve(health));
      // when
      healthController.$onInit();
      $rootScope.$apply();
      // then
      expect(healthController.health).toBe(health);
      expect($interval).toHaveBeenCalledWith(jasmine.any(Function), 20000);
    });

  });

  describe("$onDestroy()", function () {

    it("should cancel $timeout", function () {
      // given
      $interval.cancel = function (promise) { };
      spyOn($interval, 'cancel');
      const reloadTask = <ng.IPromise<any>>{};
      healthController.reloadTask = reloadTask;
      // when
      healthController.$onDestroy();
      // then
      expect($interval.cancel).toHaveBeenCalledWith(reloadTask);
    });

  });

});
