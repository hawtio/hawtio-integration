/// <reference path="mappings.component.ts"/>
/// <reference path="mapping.ts"/>

describe("MappingsService", function() {

  let jolokiaService: jasmine.SpyObj<JVM.JolokiaService>;
  let mappingsService: SpringBoot.MappingsService;
  let $q: ng.IQService;
  let $rootScope: ng.IRootScopeService;

  beforeEach(inject(function(_$q_, _$rootScope_) {
    jolokiaService = jasmine.createSpyObj('jolokiaService', ['getAttribute']);
    mappingsService = new SpringBoot.MappingsService(jolokiaService);
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  describe("getMappings()", function() {

    it("should return mappings", function(done) {
      // given
      jolokiaService.getAttribute.and.returnValue($q.resolve({
        "/webjars/**": {
          bean: "resourceHandlerMapping",
          method: "public java.lang.Object org.springframework.boot.actuate.endpoint.mvc.EndpointMvcAdapter.invoke()"
        },
        "{[/customers/multi || /customers/multi/test || /customers/multi/test/methods],methods=[GET || POST || PUT || PATCH || DELETE],params=[paramA && paramB && paramC=paramCValue],headers=[foo=bar && beer=wine],consumes=[application/json || application/xml],produces=[application/json || application/xml]}": {
          bean: "requestMappingHandlerMapping",
          method: "public void org.test.CustomerController.testMapping()"
        },
      }));

      let simpleMapping = new SpringBoot.Mapping();
      simpleMapping.bean = "resourceHandlerMapping";
      simpleMapping.beanMethod = "public java.lang.Object org.springframework.boot.actuate.endpoint.mvc.EndpointMvcAdapter.invoke()";
      simpleMapping.methods = "*";
      simpleMapping.paths = "/webjars/**";

      let complexMapping = new SpringBoot.Mapping();
      complexMapping.bean = "requestMappingHandlerMapping";
      complexMapping.beanMethod = "public void org.test.CustomerController.testMapping()";
      complexMapping.methods = "GET,POST,PUT,PATCH,DELETE";
      complexMapping.paths = "/customers/multi,/customers/multi/test,/customers/multi/test/methods";
      complexMapping.consumes = "application/json,application/xml";
      complexMapping.produces = "application/json,application/xml";
      complexMapping.params = "paramA,paramB,paramC=paramCValue";
      complexMapping.headers = "foo=bar,beer=wine";

      // when
      mappingsService.getMappings()
        .then(mappings => {
          // then
          expect(mappings).toEqual([simpleMapping, complexMapping]);
          done();
        });
      $rootScope.$apply();
    });
  });
});
