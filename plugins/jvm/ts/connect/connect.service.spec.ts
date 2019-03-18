/// <reference path="connect.service.ts"/>

describe("ConnectService", function() {

  let connectService;
  let $location;

  beforeEach(function() {
    $location = jasmine.createSpyObj('$location', ['absUrl', 'path']);
    connectService = new JVM.ConnectService(null, null, $location);
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
