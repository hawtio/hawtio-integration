/// <reference path="spring-boot.service.ts"/>

describe("SpringBootService", () => {

  const healthTab = new Nav.HawtioTab('Health', '/spring-boot/health');
  const loggersTab = new Nav.HawtioTab('Loggers', '/spring-boot/loggers');
  const traceTab = new Nav.HawtioTab('Trace', '/spring-boot/trace');
  
  let workspace: jasmine.SpyObj<Jmx.Workspace>;
  let springBootService: SpringBoot.SpringBootService;

  beforeEach(() => {
    workspace = jasmine.createSpyObj('workspace', ['treeContainsDomainAndProperties']);
    springBootService = new SpringBoot.SpringBootService(workspace);
  });

  describe("getTabs()", () => {

    it("should return all tabs", () => {
      // given
      workspace.treeContainsDomainAndProperties.and.returnValues(true, true, true);
      // when
      const tabs = springBootService.getTabs();
      // then
      expect(tabs[0]).toEqual(healthTab);
      expect(tabs[1]).toEqual(loggersTab);
      expect(tabs[2]).toEqual(traceTab);
    });

    it("should return two tabs", () => {
      // given
      workspace.treeContainsDomainAndProperties.and.returnValues(true, false, true);
      // when
      const tabs = springBootService.getTabs();
      // then
      expect(tabs[0]).toEqual(healthTab);
      expect(tabs[1]).toEqual(traceTab);
    });

    it("should return one tab", () => {
      // given
      workspace.treeContainsDomainAndProperties.and.returnValues(false, false, true);
      // when
      const tabs = springBootService.getTabs();
      // then
      expect(tabs[0]).toEqual(traceTab);
    });

    it("should return zero tabs", () => {
      // given
      workspace.treeContainsDomainAndProperties.and.returnValues(false, false, false);
      // when
      const tabs = springBootService.getTabs();
      // then
      expect(tabs.length).toBe(0);
    });
  });
});
