/// <reference path="log-entry.ts"/>

describe("LogEntry", () => {

  it("should read MDC properties from an event", () => {
    // given
    let event = {
      properties: {
        'bundle.id': '123',
        'bundle.name': 'io.hawt.jmx.test.log-entry-spec',
        'bundle.version': '1.0.0',
        'maven.coordinates': 'io.hawt.jmx.test:log-entry-spec:1.0.0'
      }
    };
    let eventMDC = _.merge({
      properties: {
        'custom.key1': 'custom.value1',
        'custom.key2': 'custom.value2',
        'custom.key3': 'custom.value3'
      }
    }, event);

    // when
    let resultNoMDC = new Logs.LogEntry(event);
    let resultMDC = new Logs.LogEntry(eventMDC);

    // then
    expect(resultNoMDC.hasMDCProps).toBe(false);
    expect(resultNoMDC.mdcProperties).toEqual({});
    expect(resultMDC.hasMDCProps).toBe(true);
    expect(resultMDC.mdcProperties).toEqual({
      'custom.key1': 'custom.value1',
      'custom.key2': 'custom.value2',
      'custom.key3': 'custom.value3'
    });
  });

  it("should match message with keyword", () => {
    let log = new Logs.LogEntry({ message: 'abcde' });
    expect(log.matchMessage('abc')).toBe(true);
    expect(log.matchMessage('ABC')).toBe(true);
    expect(log.matchMessage('xyz')).toBe(false);
  });

  it("should match property values with keyword", () => {
    let log = new Logs.LogEntry({
      properties: {
        'key1': 'ABC',
        'key2': 'xyz',
        'key3': '123'
      }
    });
    expect(log.matchProperties('abc')).toBe(true);
    expect(log.matchProperties('XYZ')).toBe(true);
    expect(log.matchProperties('123')).toBe(true);
    expect(log.matchProperties('key')).toBe(false);
  });

});
