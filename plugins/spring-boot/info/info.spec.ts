/// <reference path="info.ts"/>

describe('Info', () => {
  it('should flatten object into an array of sorted items', () => {
    const obj = {
      app: {
        test: 'hello!',
      },
      'camel.status': 'Started',
      'camel.name': 'SampleCamel',
      java: {
        jvm: {
          vendor: 'Red Hat, Inc.',
          name: 'OpenJDK 64-Bit Server VM',
          version: '11.0.14.1+1',
        },
        vendor: 'Red Hat, Inc.',
        runtime: {
          name: 'OpenJDK Runtime Environment',
          version: '11.0.14.1+1',
        },
        version: '11.0.14.1',
      },
      'camel.uptime': '1h32m6s',
      'camel.uptimeMillis': 5526493,
      'camel.version': '3.14.2',
    };
    const info = new SpringBoot.Info(obj);
    expect(info.items).toHaveSize(13);
    expect(info.items.map(i => i.key)).toEqual([
      'app.test',
      'camel.name', 'camel.status', 'camel.uptime', 'camel.uptimeMillis', 'camel.version',
      'java.jvm.name', 'java.jvm.vendor', 'java.jvm.version',
      'java.runtime.name', 'java.runtime.version',
      'java.vendor', 'java.version',
    ]);
    expect(info.items.map(i => i.value)).toEqual([
      'hello!',
      'SampleCamel', 'Started', '1h32m6s', 5526493, '3.14.2',
      'OpenJDK 64-Bit Server VM', 'Red Hat, Inc.', '11.0.14.1+1',
      'OpenJDK Runtime Environment', '11.0.14.1+1',
      'Red Hat, Inc.', '11.0.14.1',
    ]);
  });
});
