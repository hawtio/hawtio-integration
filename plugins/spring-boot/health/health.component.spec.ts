/// <reference path="health.component.ts"/>
/// <reference path="health.service.ts"/>

describe("HealthController", function() {

  let $timeout;
  let healthService: jasmine.SpyObj<SpringBoot.HealthService>;
  let healthController: SpringBoot.HealthController;
  let $q: ng.IQService;
  let $rootScope: ng.IRootScopeService;

  beforeEach(inject(function(_$q_, _$rootScope_) {
    $timeout = jasmine.createSpy('$timeout');
    healthService = jasmine.createSpyObj('jolokiaService', ['getHealth']);
    healthController = new SpringBoot.HealthController($timeout, healthService);
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  describe("$onInit()", function() {
  
    it("should load health data and start $interval", function() {
      // given
      const health = new SpringBoot.Health('UP', []);
      healthService.getHealth.and.returnValue($q.resolve(health));
      // when
      healthController.$onInit();
      $rootScope.$apply();
      // then
      expect(healthController.health).toBe(health);
      expect($timeout).toHaveBeenCalledWith(jasmine.any(Function), 20000);
    });

  });

  describe("$onDestroy()", function() {
  
    it("should cancel $timeout", function() {
      // given
      $timeout.cancel = function(promise) {};
      spyOn($timeout, 'cancel');
      const promise = <ng.IPromise<any>> {};
      healthController.promise = promise;
      // when
      healthController.$onDestroy();
      // then
      expect($timeout.cancel).toHaveBeenCalledWith(promise);
    });

  });
  
  describe("getStatusIcon()", function() {
  
    it("should return 'pficon-ok' when status is 'UP'", function() {
      // given
      healthController.health = new SpringBoot.Health('UP', []);
      // when
      const statusIcon = healthController.getStatusIcon();
      // then
      expect(statusIcon).toEqual('pficon-ok');
    });

    it("should return 'pficon-error-circle-o' when status is 'FATAL'", function() {
      // given
      healthController.health = new SpringBoot.Health('FATAL', []);
      // when
      const statusIcon = healthController.getStatusIcon();
      // then
      expect(statusIcon).toEqual('pficon-error-circle-o');
    });

    it("should return 'pficon-info' when status is not 'UP' or 'FATAL'", function() {
      // given
      healthController.health = new SpringBoot.Health('UNKNOWN', []);
      // when
      const statusIcon = healthController.getStatusIcon();
      // then
      expect(statusIcon).toEqual('pficon-info');
    });

  });
  
  describe("getStatusClass()", function() {
  
    it("should return 'alert-success' when status is 'UP'", function() {
      // given
      healthController.health = new SpringBoot.Health('UP', []);
      // when
      const statusIcon = healthController.getStatusClass();
      // then
      expect(statusIcon).toEqual('alert-success');
    });

    it("should return 'alert-danger' when status is 'FATAL'", function() {
      // given
      healthController.health = new SpringBoot.Health('FATAL', []);
      // when
      const statusIcon = healthController.getStatusClass();
      // then
      expect(statusIcon).toEqual('alert-danger');
    });

    it("should return 'alert-info' when status is not 'UP' or 'FATAL'", function() {
      // given
      healthController.health = new SpringBoot.Health('UNKNOWN', []);
      // when
      const statusIcon = healthController.getStatusClass();
      // then
      expect(statusIcon).toEqual('alert-info');
    });

  });
    
});
