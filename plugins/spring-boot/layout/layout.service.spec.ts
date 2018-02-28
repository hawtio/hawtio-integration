describe("SpringBootLayoutService", function() {

  let workspace: jasmine.SpyObj<Jmx.workspace>;
  let layoutService: SpringBoot.SpringBootLayoutService;
  let $q: ng.IQService;
  let $rootScope: ng.IRootScopeService;

  beforeEach(inject(function(_$q_, _$rootScope_) {
    workspace = jasmine.createSpyObj('workspace', ['treeContainsDomainAndProperties']);
    layoutService = new SpringBoot.SpringBootLayoutService(workspace);
  }));

  describe("getTabs()", function() {

    it("should return tabs for available endpoints", function(done) {
      // given
      workspace.treeContainsDomainAndProperties.and.returnValues(false, true, true);

      // when
      let tabs: Nav.HawtioTab[] = layoutService.getTabs();

      // then
      expect(tabs.length).toBe(2);
      done();
    });
  });
});
