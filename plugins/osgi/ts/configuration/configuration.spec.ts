/// <reference path="configuration-property.ts"/>
/// <reference path="configuration.ts"/>

describe("Configuration", function () {

  describe("constructor", function () {

    it("should set 'id' and 'properties' fields", function () {
      // given
      const id = 'test1';
      const properties = [
        new Osgi.ConfigurationProperty('a', 'b')
      ];
      // when
      const configuration = new Osgi.Configuration(id, properties);
      // then
      expect(configuration.id).toBe(id);
      expect(configuration.properties).toBe(properties);
    });

  });

  describe("getPropertiesAsJson", function () {

    it("should return JSON string using configuration property keys as JSON object property names", function () {
      testWith([], '{}');
      testWith([
        new Osgi.ConfigurationProperty('a', 'b')
      ], '{"a":"b"}');
      testWith([
        new Osgi.ConfigurationProperty('a', 'b'),
        new Osgi.ConfigurationProperty('c', 'd')
      ], '{"a":"b","c":"d"}');
    });

    function testWith(properties: Osgi.ConfigurationProperty[], expectedJson: string) {
      // when
      const configuration = new Osgi.Configuration('id', properties);
      // then
      expect(configuration.getPropertiesAsJson()).toBe(expectedJson);
    }

  });

});
