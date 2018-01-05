/// <reference path="health.component.ts"/>

describe("HealthController", function() {

  let $interval;
  let jolokiaService;
  let humanizeService;
  let healthController;

  beforeEach(function() {
    $interval = jasmine.createSpy('$interval');
    jolokiaService = jasmine.createSpyObj('jolokiaService', Object.getOwnPropertyNames(JVM.JolokiaService.prototype));
    humanizeService = new Core.HumanizeService();
    healthController = new SpringBoot.HealthController($interval, jolokiaService, humanizeService);
  });

  describe("buildItems()", function() {

    it("should return empty array when data object has no additional properties", function() {
      // given
      const data = {status: "UP"};
      // when
      const items = healthController.buildItems(data);
      // then
      expect(items).toEqual([]);
    });
  
    it("should return two items when data object has two additional properties", function() {
      // given
      const data = {
        camel: {contextStatus: "Started", name: "SampleCamel", version: "2.19.2", status: "UP"},
        diskSpace: {total: 220138139648, threshold: 10485760, free: 117575626752, status: "UP"},
        status: "UP"
      };
      // when
      const items = healthController.buildItems(data);
      // then
      expect(items).toEqual([
        {title: "Camel", info: ["Context status: Started", "Name: SampleCamel", "Version: 2.19.2", "Status: UP"]},
        {title: "Disk space", info: ["Total: 220138139648", "Threshold: 10485760", "Free: 117575626752", "Status: UP"]}
      ]);
    });

  });

  describe("getStatusIcon()", function() {
  
    it("should return 'pficon-ok' when status is 'UP'", function() {
      // given
      healthController.status = 'UP';
      // when
      const statusIcon = healthController.getStatusIcon();
      // then
      expect(statusIcon).toEqual('pficon-ok');
    });

    it("should return 'pficon-error-circle-o' when status is 'FATAL'", function() {
      // given
      healthController.status = 'FATAL';
      // when
      const statusIcon = healthController.getStatusIcon();
      // then
      expect(statusIcon).toEqual('pficon-error-circle-o');
    });

    it("should return 'pficon-info' when status is not 'UP' or 'FATAL'", function() {
      // given
      healthController.status = 'UNKNOWN';
      // when
      const statusIcon = healthController.getStatusIcon();
      // then
      expect(statusIcon).toEqual('pficon-info');
    });

  });

  describe("getStatusClass()", function() {
  
    it("should return 'alert-success' when status is 'UP'", function() {
      // given
      healthController.status = 'UP';
      // when
      const statusIcon = healthController.getStatusClass();
      // then
      expect(statusIcon).toEqual('alert-success');
    });

    it("should return 'alert-danger' when status is 'FATAL'", function() {
      // given
      healthController.status = 'FATAL';
      // when
      const statusIcon = healthController.getStatusClass();
      // then
      expect(statusIcon).toEqual('alert-danger');
    });

    it("should return 'alert-info' when status is not 'UP' or 'FATAL'", function() {
      // given
      healthController.status = 'UNKNOWN';
      // when
      const statusIcon = healthController.getStatusClass();
      // then
      expect(statusIcon).toEqual('alert-info');
    });

  });
    
});
