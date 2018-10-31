/// <reference path="trace.component.ts"/>
/// <reference path="trace.ts"/>

describe("TraceService", function() {

  let jolokiaService: jasmine.SpyObj<JVM.JolokiaService>;
  let springBootService: jasmine.SpyObj<SpringBoot.SpringBootService>;
  let traceService: SpringBoot.TraceService;
  let $q: ng.IQService;
  let $rootScope: ng.IRootScopeService;

  beforeEach(inject(function(_$q_, _$rootScope_) {
    jolokiaService = jasmine.createSpyObj('jolokiaService', ['execute']);
    springBootService = jasmine.createSpyObj('springBootService', ['getEndpointMBean']);
    traceService = new SpringBoot.TraceService(jolokiaService, springBootService);
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  describe("Spring Boot 1.x", function() {

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

        let expectedTraces = [
          new SpringBoot.Trace(data[0]),
          new SpringBoot.Trace(data[1]),
        ];

        verifyTraces(data, expectedTraces, done);
      });

      it("should filter jolokia paths", function(done) {
        let data = [
          { timestamp: 1, info: { path: "/info", headers: {}}},
          { timestamp: 2, info: { path: "/jolo", headers: {}}},
          { timestamp: 3, info: { path: "/jolo/", headers: {}}},
          { timestamp: 4, info: { path: "/jolokia", headers: {}}},
          { timestamp: 5, info: { path: "/jolokia/", headers: {}}},
          { timestamp: 6, info: { path: "/jolokia/read", headers: {}}},
          { timestamp: 7, info: { path: "/jolokia/read/foo", headers: {}}},
        ];

        let expectedTraces = [
          new SpringBoot.Trace(data[0]),
          new SpringBoot.Trace(data[1]),
          new SpringBoot.Trace(data[2]),
        ];

        verifyTraces(data, expectedTraces, done);
      });
    });

  });

  describe("Spring Boot 2.x", function() {

    describe("getTraces()", function() {

      it("should return traces", function(done) {
        let data = [
          {
            timestamp: 1516808934460,
            timeTaken: "6",
            request: {
              method: "GET",
              uri: "http://localhost:8080/info",
            },
            response: {
              status: "200"
            }
          },
          {
            timestamp: 1516808934394,
            timeTaken: "1",
            request: {
              method: "POST",
              uri: "http://localhost:8080/bar",
            },
            response: {
              status: "500"
            }
          },
        ];

        let expectedTraces = [
          new SpringBoot.Trace(data[0]),
          new SpringBoot.Trace(data[1]),
        ];

        verifyTraces(data, expectedTraces, done);
      });

      it("should filter jolokia paths", function(done) {
        let data = [
          { timestamp: 1, request: { uri: "http://localhost:8080/info"}},
          { timestamp: 2, request: { uri: "http://localhost:8080/jolo"}},
          { timestamp: 3, request: { uri: "http://localhost:8080/jolo/"}},
          { timestamp: 4, request: { uri: "http://localhost:8080/jolokia"}},
          { timestamp: 5, request: { uri: "http://localhost:8080/jolokia/"}},
          { timestamp: 6, request: { uri: "http://localhost:8080/jolokia/read"}},
          { timestamp: 7, request: { uri: "http://localhost:8080/jolokia/read/foo"}},
          { timestamp: 8, request: { uri: "http://localhost:8080/actuator/jolokia/read/foo"}},
        ];

        let expectedTraces = [
          new SpringBoot.Trace(data[0]),
          new SpringBoot.Trace(data[1]),
          new SpringBoot.Trace(data[2]),
        ];

        verifyTraces(data, expectedTraces, done);
      });
    });
  });

  const verifyTraces = (endpointResponse: any, expectedTraces: any, done: any) => {
    springBootService.getEndpointMBean.and.returnValue({objectName: 'Trace', operation: 'getTraces'});
    jolokiaService.execute.and.returnValue($q.resolve(endpointResponse));

    traceService.getTraces()
      .then(traces => {
        expect(traces).toEqual(expectedTraces);
        done();
      });
    $rootScope.$apply();
  };
});
