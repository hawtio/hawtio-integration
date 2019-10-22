/// <reference path="connect.service.ts"/>

describe("ConnectService", function() {

  let connectService;
  let $location;
  let $window;

  beforeEach(function() {
    $location = jasmine.createSpyObj('$location', ['absUrl', 'path']);
    $window = {localStorage: jasmine.createSpyObj('localStorage', ['getItem', 'setItem'])};
    connectService = new JVM.ConnectService(null, $window, $location);
  });

  describe("getConnections", function() {

    it("should return saved connections", function () {
      // given
      const savedConnectionsJson = '[{"scheme":"http","host":"localhost","port":8181,"path":"/hawtio/jolokia","useProxy":true,"jolokiaUrl":null,"userName":"","password":"","view":null,"name":"karaf","reachable":false},{"name":"spring-boot","scheme":"http","host":"localhost","port":8080,"path":"/actuator/jolokia","useProxy":true,"jolokiaUrl":null,"userName":null,"password":null,"reachable":false}]';
      const expectedConnections = JSON.parse(savedConnectionsJson);
      $window.localStorage.getItem.and.returnValue(savedConnectionsJson);
      // when
      const connections = connectService.getConnections();
      // then
      expect($window.localStorage.getItem).toHaveBeenCalledWith('jvmConnect');
      expect(connections).toEqual(expectedConnections);
    });

    it("should convert old connections", function () {
      // given
      const savedConnectionsJson = '{"karaf":{"scheme":"http","host":"localhost","port":8181,"path":"/hawtio/jolokia","useProxy":true,"jolokiaUrl":null,"view":null,"name":"karaf","userName":"admin","password":"admin"},"spring-boot":{"scheme":"http","host":"localhost","port":8080,"path":"/actuator/jolokia","useProxy":true,"jolokiaUrl":null,"view":null,"name":"spring-boot"}}';
      const expectedConnections = Object.values(JSON.parse(savedConnectionsJson));
      $window.localStorage.getItem.and.returnValue(savedConnectionsJson);
      // when
      const connections = connectService.getConnections();
      // then
      expect($window.localStorage.getItem).toHaveBeenCalledWith('jvmConnect');
      expect(connections).toEqual(expectedConnections);
    });

  });


  describe("getBrowserUrlPortNumber", function() {

    it("should return null when URL doesn't specify a port", function () {
      // given
      $location.absUrl.and.returnValue('http://example.com/jvm/connect');
      // when
      const port = connectService.getBrowserUrlPortNumber();
      // then
      expect(port).toBeNull();
    });

    it("should return port number when URL specifies one", function () {
      // given
      $location.absUrl.and.returnValue('http://example.com:8080/jvm/connect');
      // when
      const port = connectService.getBrowserUrlPortNumber();
      // then
      expect(port).toBe(8080);
    });

  });

  describe("getBrowserUrlContextPath", function () {

    it("should return empty string when URL doesn't include a context path", function () {
      // given
      $location.absUrl.and.returnValue('http://example.com/jvm/connect');
      $location.path.and.returnValue('/jvm/connect');
      // when
      const contextPath = connectService.getBrowserUrlContextPath();
      // then
      expect(contextPath).toBe('');
    });

    it("should return context path when URL includes one", function () {
      // given
      $location.absUrl.and.returnValue('http://example.com/hawtio/jvm/connect');
      $location.path.and.returnValue('/jvm/connect');
      // when
      const contextPath = connectService.getBrowserUrlContextPath();
      // then
      expect(contextPath).toBe('/hawtio');
    });

  });

  describe("getDefaultOptions", function () {

    it("should return default options based on current browser URL", function () {
      // given
      $location.absUrl.and.returnValue('http://example.com:8080/hawtio/jvm/connect');
      $location.path.and.returnValue('/jvm/connect');
      // when
      const defaultOptions = connectService.getDefaultOptions();
      // then
      expect(defaultOptions).toEqual({port: 8080, path: '/hawtio/jolokia'});
    });

  });

});
