/// <reference path="health.component.ts"/>
/// <reference path="health.service.ts"/>

describe("HealthController", function () {

  let $timeout;
  let healthService: jasmine.SpyObj<SpringBoot.HealthService>;
  let healthController: SpringBoot.HealthController;
  let $q: ng.IQService;
  let $rootScope: ng.IRootScopeService;

  beforeEach(inject(function (_$q_, _$rootScope_) {
    $timeout = jasmine.createSpy('$timeout');
    healthService = jasmine.createSpyObj('jolokiaService', ['getHealth']);
    healthController = new SpringBoot.HealthController($timeout, healthService);
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
      expect($timeout).toHaveBeenCalledWith(jasmine.any(Function), 20000);
    });

  });

  describe("$onDestroy()", function () {

    it("should cancel $timeout", function () {
      // given
      $timeout.cancel = function (promise) { };
      spyOn($timeout, 'cancel');
      const promise = <ng.IPromise<any>>{};
      healthController.promise = promise;
      // when
      healthController.$onDestroy();
      // then
      expect($timeout.cancel).toHaveBeenCalledWith(promise);
    });

  });

});
