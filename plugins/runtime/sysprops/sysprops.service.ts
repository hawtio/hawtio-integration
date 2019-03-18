/// <reference path="sysprop.ts"/>

namespace Runtime {

  export class SystemPropertiesService {

    constructor(private jolokiaService: JVM.JolokiaService) {
      'ngInject';
    }

    getSystemProperties(): ng.IPromise<SystemProperty[]> {
      return this.jolokiaService.getAttribute('java.lang:type=Runtime', null)
        .then(data => {
          let systemProperties: SystemProperty[] = [];

          angular.forEach(data.SystemProperties, (value: string, key: string) => {
            let sysprop: SystemProperty = {
              name: key,
              value: value
            }
            systemProperties.push(sysprop)
          });

          return systemProperties;
      });
    }
  }
}
