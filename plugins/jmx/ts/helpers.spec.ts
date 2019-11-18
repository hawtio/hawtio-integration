/// <reference path="helpers.ts"/>

describe("coreHelpers", () => {

  describe("escapeMBean", () => {

    it("should escape MBean names", () => {
      // given
      let mbeans = ['aaa/bbb/ccc', 'aaa!bbb!ccc', 'aaa"bbb"ccc', 'a/b!c"d'];
      let escaped = ['aaa!/bbb!/ccc', 'aaa!!bbb!!ccc', 'aaa!%22bbb!%22ccc', 'a!/b!!c!%22d'];
      // when
      let results = mbeans.map(mbean => Core.escapeMBean(mbean));
      // then
      _.zip(results, escaped).forEach(
        ([result, expected]) => expect(result).toBe(expected));
    });

  });

  describe("escapeMBeanPath", () => {

    it("should escape MBean paths", () => {
      // given
      let mbeans = ['java.lang:type=Memory'];
      let escaped = ['java.lang/type=Memory'];
      // when
      let results = mbeans.map(mbean => Core.escapeMBeanPath(mbean));
      // then
      _.zip(results, escaped).forEach(
        ([result, expected]) => expect(result).toBe(expected));
    });

  });

  describe("fixOsgiPathsOrdering", () => {

    it("should fix osgi.compendium paths ordering", () => {
      // given
      let domainText = 'osgi.compendium';
      let paths = [
        {"key":"framework","value":"org.apache.felix.framework"},
        {"key":"service","value":"cm"},
        {"key":"uuid","value":"3d2e305b-ed36-45d3-9299-6e5873b36ed8"},
        {"key":"version","value":"1.3"}
      ];
      // when
      Core.fixOsgiPathsOrdering(domainText, paths);
      // then
      expect(paths).toEqual([
        {"key":"service","value":"cm"},
        {"key":"version","value":"1.3"},
        {"key":"framework","value":"org.apache.felix.framework"},
        {"key":"uuid","value":"3d2e305b-ed36-45d3-9299-6e5873b36ed8"}
      ]);
    });

    it("should not change osgi.compendium paths when already in the right order", () => {
      // given
      let domainText = 'osgi.compendium';
      let paths = [
        {"key":"service","value":"cm"},
        {"key":"version","value":"1.3"},
        {"key":"framework","value":"org.apache.felix.framework"},
        {"key":"uuid","value":"3d2e305b-ed36-45d3-9299-6e5873b36ed8"}
      ];
      // when
      Core.fixOsgiPathsOrdering(domainText, paths);
      // then
      expect(paths).toEqual(paths);
    });

    it("should fix osgi.core paths", () => {
      // given
      let domainText = 'osgi.core';
      let paths = [
        {"key":"framework","value":"org.apache.felix.framework"},
        {"key":"type","value":"wiringState"},
        {"key":"uuid","value":"3d2e305b-ed36-45d3-9299-6e5873b36ed8"},
        {"key":"version","value":"1.1"}
      ];
      // when
      Core.fixOsgiPathsOrdering(domainText, paths);
      // then
      expect(paths).toEqual([
        {"key":"type","value":"wiringState"},
        {"key":"version","value":"1.1"},
        {"key":"framework","value":"org.apache.felix.framework"},
        {"key":"uuid","value":"3d2e305b-ed36-45d3-9299-6e5873b36ed8"}
      ]);
    });

    it("should not change osgi.core paths when already in the right order", () => {
      // given
      let domainText = 'osgi.core';
      let paths = [
        {"key":"type","value":"wiringState"},
        {"key":"version","value":"1.1"},
        {"key":"framework","value":"org.apache.felix.framework"},
        {"key":"uuid","value":"3d2e305b-ed36-45d3-9299-6e5873b36ed8"}
      ];
      // when
      Core.fixOsgiPathsOrdering(domainText, paths);
      // then
      expect(paths).toEqual(paths);
    });

    it("should not fix other paths", () => {
      // given
      let domainText = 'a.b';
      let paths = [
        {"key":"framework","value":"org.apache.felix.framework"},
        {"key":"type","value":"wiringState"},
        {"key":"uuid","value":"3d2e305b-ed36-45d3-9299-6e5873b36ed8"},
        {"key":"version","value":"1.1"}
      ];
      // when
      Core.fixOsgiPathsOrdering(domainText, paths);
      // then
      expect(paths).toEqual(paths);
    });

  });

});
