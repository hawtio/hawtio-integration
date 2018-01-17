/// <reference path="mappings.component.ts"/>
/// <reference path="mappings.service.ts"/>

describe("MappingsController", function() {

  let mappingsService: jasmine.SpyObj<SpringBoot.MappingsService>;
  let mappingsController: SpringBoot.MappingsController;

  let $q: ng.IQService;
  let $rootScope: ng.IRootScopeService;

  beforeEach(inject(function(_$q_, _$rootScope_) {
    mappingsService = jasmine.createSpyObj('mappingsService', ['getMappings']);
    mappingsController = new SpringBoot.MappingsController(mappingsService);
    $q = _$q_;
    $rootScope = _$rootScope_;
  }));

  describe("$onInit()", function() {

    it("should load mapping data", function() {
      // given
      let mappings = [new SpringBoot.Mapping()];
      mappingsService.getMappings.and.returnValue($q.resolve(mappings));
      // when
      mappingsController.$onInit();
      $rootScope.$apply();
      // then
      expect(mappingsController.mappings).toBe(mappings);
      expect(mappingsController.tableItems).toBe(mappings);
      expect(mappingsController.loading).toBe(false);
    });
  });

  describe("applyFilters()", function() {

    it("returns filtered results for matching mapping path", function () {
      //given
      let mappingA = new SpringBoot.Mapping();
      mappingA.paths = "/parent,/parent/childA";
      let mappingB = new SpringBoot.Mapping();
      mappingB.paths = "/parent,/parent/childB";
      mappingsController.mappings = [mappingA, mappingB];
      // when
      mappingsController.applyFilters([{id: 'path', value: 'childB'}]);
      // then
      expect(mappingsController.tableItems).toEqual([mappingB]);
    });

    it("returns filtered results for matching HTTP method", function () {
      //given
      let mappingA = new SpringBoot.Mapping();
      mappingA.methods = "GET,PUT,TRACE";
      let mappingB = new SpringBoot.Mapping();
      mappingB.methods = "GET,POST,PUT,DELETE";
      mappingsController.mappings = [mappingA, mappingB];
      // when
      mappingsController.applyFilters([{id: 'method', value: 'DELETE'}]);
      // then
      expect(mappingsController.tableItems).toEqual([mappingB]);
    });

    it("returns filtered results for matching consumes", function () {
      //given
      let mappingA = new SpringBoot.Mapping();
      mappingA.consumes = "application/json";
      let mappingB = new SpringBoot.Mapping();
      mappingB.consumes = "application/xml";
      mappingsController.mappings = [mappingA, mappingB];
      // when
      mappingsController.applyFilters([{id: 'consumes', value: 'xml'}]);
      // then
      expect(mappingsController.tableItems).toEqual([mappingB]);
    });

    it("returns filtered results for matching produces", function () {
      //given
      let mappingA = new SpringBoot.Mapping();
      mappingA.produces = "application/json";
      let mappingB = new SpringBoot.Mapping();
      mappingB.produces = "application/xml";
      mappingsController.mappings = [mappingA, mappingB];
      // when
      mappingsController.applyFilters([{id: 'produces', value: 'xml'}]);
      // then
      expect(mappingsController.tableItems).toEqual([mappingB]);
    });

    it("returns filtered results for matching bean method", function () {
      //given
      let mappingA = new SpringBoot.Mapping();
      mappingA.beanMethod = "public void org.test.TestMappingClass.doSomething()";
      let mappingB = new SpringBoot.Mapping();
      mappingB.beanMethod = "public void org.test.TestMappingClass.doSomethingElse()";
      mappingsController.mappings = [mappingA, mappingB];
      // when
      mappingsController.applyFilters([{id: 'beanMethod', value: 'SomethingElse'}]);
      // then
      expect(mappingsController.tableItems).toEqual([mappingB]);
    });
  });
});
