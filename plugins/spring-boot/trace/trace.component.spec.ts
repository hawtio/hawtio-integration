/// <reference path="trace.component.ts"/>
/// <reference path="trace.service.ts"/>

describe("TraceController", function() {

  let $interval;
  let $scope;
  let $timeout: ng.ITimeoutService;
  let $filter: ng.IFilterService;
  let $uibModal
  let traceService: jasmine.SpyObj<SpringBoot.TraceService>;
  let traceController: SpringBoot.TraceController;
  let $q: ng.IQService;
  let $rootScope: ng.IRootScopeService;

  beforeEach(inject(function(_$q_, _$rootScope_, _$filter_) {
    $interval = jasmine.createSpy('$interval');
    $scope = jasmine.createSpy('$scope');
    $timeout = jasmine.createSpy('$timeout');
    $uibModal = jasmine.createSpy("$uibModal");
    traceService = jasmine.createSpyObj('mappingsService', ['getTraces']);
    $filter =  _$filter_;
    $q = _$q_;
    $rootScope = _$rootScope_;
    traceController = new SpringBoot.TraceController(traceService, $scope, $filter, $timeout, $interval, $uibModal);
  }));

  describe("$onInit()", function() {
    it("should load trace data and start $interval", function() {
      // given
      let traces: SpringBoot.Trace[] = [new SpringBoot.Trace({info: { headers: {}}})];
      traceService.getTraces.and.returnValue($q.resolve(traces));
      // when
      traceController.$onInit();
      $rootScope.$apply();
      // then
      expect(traceController.traces).toEqual(traces);
      expect(traceController.tableItems).toEqual(traces);
      expect(traceController.loading).toBe(false);
      expect($interval).toHaveBeenCalledWith(jasmine.any(Function), 10000);      
    });
  });

  describe("$onDestroy()", function() {
    it("should cancel $interval", function() {
      // given
      $interval.cancel = function(promise) {};
      spyOn($interval, 'cancel');
      const promise = <ng.IPromise<any>> {};
      traceController.promise = promise;
      // when
      traceController.$onDestroy();
      // then
      expect($interval.cancel).toHaveBeenCalledWith(promise);
    });
  });

  describe("loadTraces()", function() {
    it("should append new trace data", function() {
      //given
      let aggregatedTraces: SpringBoot.Trace[] = [
        new SpringBoot.Trace({timestamp: '4', info: { headers: {}}}),
        new SpringBoot.Trace({timestamp: '3', info: { headers: {}}}),
        new SpringBoot.Trace({timestamp: '2', info: { headers: {}}}),
        new SpringBoot.Trace({timestamp: '1', info: { headers: {}}})
      ];
      let newTraces: SpringBoot.Trace[] = [
        aggregatedTraces[0],
        aggregatedTraces[1]
      ];
      let existingTraces: SpringBoot.Trace[] =  [
        aggregatedTraces[2],
        aggregatedTraces[3]
      ];
      traceController.traces = existingTraces;
      traceService.getTraces.and.returnValue($q.resolve(newTraces));
      //when
      traceController.loadTraces();
      $rootScope.$apply();
      //then
      expect(traceController.traces).toEqual(aggregatedTraces);
    });

    it("should remove old trace data when cache limit exceeded", function() {
      //given
      let existingTraces: SpringBoot.Trace[] = [];
      for (let i = 500; i >= 1; i--) {
        existingTraces.push(new SpringBoot.Trace({timestamp: i.toString(), info: { headers: {}}}))
      }
      let newTraces: SpringBoot.Trace[] = [];
      for (let i = 503; i >= 501; i--) {
        newTraces.push(new SpringBoot.Trace({timestamp: i.toString(), info: { headers: {}}}))
      }
      traceController.traces = existingTraces;
      traceService.getTraces.and.returnValue($q.resolve(newTraces));
      //when
      traceController.loadTraces();
      $rootScope.$apply();
      //then
      // Traces with timestamps 1,2 & 3 should have been removed
      // so we expect the last elements to be as follows
      expect(traceController.traces[497].timestamp).toBe('6');
      expect(traceController.traces[498].timestamp).toBe('5');
      expect(traceController.traces[499].timestamp).toBe('4');
    });
  });

  describe("applyFilters()", function() {
    it("returns filtered results for matching timestamp", function() {
      //given
      let traceA: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '2018-01-25 11:12:13.124', info: { headers: {}}});
      let traceB: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '2018-01-25 11:12:13.123', info: { headers: {}}});
      let traceC: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '2018-01-24 00:11:22.432', info: { headers: {}}});
      traceController.traces = [traceA, traceB, traceC];
      //when
      traceController.applyFilters([{id: 'timestamp', value: '2018-01-25'}]);
      $rootScope.$apply();
      //then
      expect(traceController.tableItems).toEqual([traceA, traceB]);
    });

    it("returns filtered results for matching status", function() {
      //given
      let traceA: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '1', info: { headers: {response: {status: 200}}}});
      let traceB: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '2', info: { headers: {response: {status: 500}}}});
      let traceC: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '3', info: { headers: {response: {status: 200}}}});
      traceController.traces = [traceA, traceB, traceC];
      //when
      traceController.applyFilters([{id: 'status', value: '200'}]);
      $rootScope.$apply();
      //then
      expect(traceController.tableItems).toEqual([traceA, traceC]);
    });

    it("returns filtered results for matching method", function() {
      //given
      let traceA: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '1', info: { method: "DELETE", headers: {}}});
      let traceB: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '2', info: { method: "GET", headers: {}}});
      let traceC: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '3', info: { method: "GET", headers: {}}});
      traceController.traces = [traceA, traceB, traceC];
      //when
      traceController.applyFilters([{id: 'method', value: 'GET'}]);
      $rootScope.$apply();
      //then
      expect(traceController.tableItems).toEqual([traceB, traceC]);
    });

    it("returns filtered results for matching path", function() {
      //given
      let traceA: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '1', info: { path: "/foo", headers: {}}});
      let traceB: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '2', info: { path: "/foo/bar", headers: {}}});
      let traceC: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '3', info: { path: "/cheese", headers: {}}});
      traceController.traces = [traceA, traceB, traceC];
      //when
      traceController.applyFilters([{id: 'path', value: 'foo'}]);
      $rootScope.$apply();
      //then
      expect(traceController.tableItems).toEqual([traceA, traceB]);
    });

    it("returns filtered results for matching timeTaken", function() {
      //given
      let traceA: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '1', info: { timeTaken: 1, headers: {}}});
      let traceB: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '2', info: { timeTaken: 222, headers: {}}});
      let traceC: SpringBoot.Trace = new SpringBoot.Trace({timestamp: '3', info: { timeTaken: 1234, headers: {}}});
      traceController.traces = [traceA, traceB, traceC];
      //when
      traceController.applyFilters([{id: 'timeTaken', value: 222}]);
      $rootScope.$apply();
      //then
      expect(traceController.tableItems).toEqual([traceB]);
    });    
  });

  describe("getStatusClass()", function() {
    it("should return a pficon-ok class for a HTTP success status code", function() {
      //given
      let trace200Status: SpringBoot.Trace = new SpringBoot.Trace({info: { headers: {response: {status: 200}}}});
      let trace301Status: SpringBoot.Trace = new SpringBoot.Trace({info: { headers: {response: {status: 301}}}});
      //when
      let statusClassA = traceController.getStatusClass(trace200Status);
      let statusClassB = traceController.getStatusClass(trace301Status);
      //then
      expect(statusClassA).toBe('http-status-code-icon pficon pficon-ok');
      expect(statusClassB).toBe('http-status-code-icon pficon pficon-ok');
    });

    it("should return a pficon-err class for a HTTP error status code", function() {
      //given
      let trace400Status: SpringBoot.Trace = new SpringBoot.Trace({info: { headers: {response: {status: 400}}}});
      let trace500Status: SpringBoot.Trace = new SpringBoot.Trace({info: { headers: {response: {status: 500}}}});
      //when
      let statusClassA = traceController.getStatusClass(trace400Status);
      let statusClassB = traceController.getStatusClass(trace500Status);
      //then
      expect(statusClassA).toBe('http-status-code-icon pficon pficon-error-circle-o');
      expect(statusClassB).toBe('http-status-code-icon pficon pficon-error-circle-o');
    });

    it("should return an empty string for a null status code", function() {
      //given
      let trace: SpringBoot.Trace = new SpringBoot.Trace({info: { headers: {}}});
      //when
      let statusClass = traceController.getStatusClass(trace);
      //then
      expect(statusClass).toBe('');
    });
  });
});
