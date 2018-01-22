/// <reference path="trace.component.ts"/>
/// <reference path="trace.ts"/>

describe("TraceService", function() {

  let jolokiaService: jasmine.SpyObj<JVM.JolokiaService>;
  let traceService: SpringBoot.TraceService;
  let $q: ng.IQService;
  let $rootScope: ng.IRootScopeService;

  beforeEach(inject(function(_$q_, _$rootScope_) {
    jolokiaService = jasmine.createSpyObj('jolokiaService', ['getAttribute']);
    traceService = new SpringBoot.TraceService(jolokiaService);
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  describe("getTraces()", function() {
    
    it("should return traces", function(done) {
      // given
      let data = [
        {
          timestamp: 1516808934460,
          info: {
            method: "GET",
            path: "/info",
            headers: {
              request: {
              },
              response: {
                status: "200"
              }
            },
            timeTaken: "6"
          }
        },
        {
          timestamp: 1516808934394,
          info: {
            method: "POST",
            path: "/bar",
            headers: {
              request: {
              },
              response: {
                status: "500"
              }
            },
            timeTaken: "1"
          }
        },
      ];

      jolokiaService.getAttribute.and.returnValue($q.resolve(data));

      let expectedTraces = [
        new SpringBoot.Trace(data[0]), 
        new SpringBoot.Trace(data[1]), 
      ];

      // when
      traceService.getTraces()
        .then(traces => {
          // then
          expect(traces).toEqual(expectedTraces);
          done();
        });
      $rootScope.$apply();

    });

    it("should filter jolokia paths", function(done) {

      // given
      let data = [
        {
          timestamp: 1516808934460,
          info: {
            method: "GET",
            path: "/info",
            headers: {
              request: {
              },
              response: {
                status: "200"
              }
            },
            timeTaken: "6"
          }
        },
        {
          timestamp: 1516808934394,
          info: {
            method: "POST",
            path: "/jolokia",
            headers: {
              request: {
              },
              response: {
                status: "200"
              }
            },
            timeTaken: "1"
          }
        },
      ];

      jolokiaService.getAttribute.and.returnValue($q.resolve(data));

      let expectedTraces = [
        new SpringBoot.Trace(data[0]), 
      ];

      // when
      traceService.getTraces()
        .then(traces => {
          // then
          expect(traces).toEqual(expectedTraces);
          done();
        });
      $rootScope.$apply();
    });
  });
});
