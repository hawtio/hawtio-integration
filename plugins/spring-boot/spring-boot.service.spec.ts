/// <reference path="spring-boot.service.ts"/>
/// <reference path="common/endpoint-mbean.ts"/>

describe("SpringBootService", () => {

  const healthTab = new Nav.HawtioTab('Health', '/spring-boot/health');
  const infoTab = new Nav.HawtioTab('Info', '/spring-boot/info');
  const loggersTab = new Nav.HawtioTab('Loggers', '/spring-boot/loggers');
  const traceTab = new Nav.HawtioTab('Trace', '/spring-boot/trace');

  let workspace: jasmine.SpyObj<Jmx.Workspace>;
  let springBootService: SpringBoot.SpringBootService;

  beforeEach(() => {
    workspace = jasmine.createSpyObj('workspace', ['treeContainsDomainAndProperties', 'findMBeanWithProperties']);
    springBootService = new SpringBoot.SpringBootService(workspace);
  });

  describe("getTabs()", () => {

    it("should return all tabs", () => {
      // given
      workspace.treeContainsDomainAndProperties.and.returnValues(true,true,true,true);
      // when
      const tabs = springBootService.getTabs();
      // then
      expect(tabs[0]).toEqual(healthTab);
      expect(tabs[1]).toEqual(infoTab);
      expect(tabs[2]).toEqual(loggersTab);
      expect(tabs[3]).toEqual(traceTab);
    });

    it("should return three tabs", () => {
      // given
      workspace.treeContainsDomainAndProperties.and.returnValues(true, false, false, true, false, true);
      // when
      const tabs = springBootService.getTabs();
      // then
      expect(tabs[0]).toEqual(healthTab);
      expect(tabs[1]).toEqual(loggersTab);
      expect(tabs[2]).toEqual(traceTab);
    });


    it("should return two tabs", () => {
      // given
      workspace.treeContainsDomainAndProperties.and.returnValues(true, false, false, false, true);
      // when
      const tabs = springBootService.getTabs();
      // then
      expect(tabs[0]).toEqual(healthTab);
      expect(tabs[1]).toEqual(traceTab);
    });

    it("should return one tab", () => {
      // given
      workspace.treeContainsDomainAndProperties.and.returnValues(false, false, false, false, false, false, true);
      // when
      const tabs = springBootService.getTabs();
      // then
      expect(tabs[0]).toEqual(traceTab);
    });

    it("should return zero tabs", () => {
      // given
      workspace.treeContainsDomainAndProperties.and.returnValues(false, false, false, false, false, false,false, false);
      // when
      const tabs = springBootService.getTabs();
      // then
      expect(tabs.length).toBe(0);
    });
  });

  describe("getEndpointMBean()", () => {

    it("should return MBean for matching endpoint operation", () => {
      // given
      const mbean = {
        objectName: 'Health',
        mbean: {
          op: {
            updateHealth: {},
            isSensitive: {},
            getHealth: {}
          }
        }
      };
      workspace.findMBeanWithProperties.and.returnValues(null, mbean, null);
      // when
      const endpointMBean: SpringBoot.EndpointMBean = springBootService.getEndpointMBean(['healthEndpoint', 'Health', 'healthz'], ['getHealth', 'health']);
      // then
      expect(endpointMBean).toEqual({objectName: 'Health', operation: 'getHealth'});
    });

    it("should return null for no matching endpoint operation", () => {
      // given
      const mbean = {
        mbean: {
          op: {
            updateHealth: {},
            isSensitive: {},
            getHealth: {}
          }
        }
      };
      workspace.findMBeanWithProperties.and.returnValues(null, null, null);
      // when
      const endpointMBean: SpringBoot.EndpointMBean = springBootService.getEndpointMBean(['healthEndpoint', 'Health', 'healthz'], ['getHealth', 'health']);
      // then
      expect(endpointMBean).toBeNull();
    });
  });

  describe("isValid()", () => {

    it("should return true when spring boot endpoints enabled", () => {
      // given
      workspace.treeContainsDomainAndProperties.and.returnValues(false, false, false, false, true, true);
      // when
      const isValid = springBootService.isValid();
      // then
      expect(isValid).toEqual(true);
    });

    it("should return false when spring boot endpoints disabled", () => {
      // given
      workspace.treeContainsDomainAndProperties.and.returnValue(null);
      // when
      const isValid = springBootService.isValid();
      // then
      expect(isValid).toEqual(false);
    });
  });
});
