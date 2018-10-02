/// <reference path="configuration-property.ts"/>

namespace Osgi {

  export class Configuration {

    constructor(public id: string, public properties: ConfigurationProperty[]) {
    }

    getPropertiesAsJson(): string {
      let obj = {};
      this.properties.forEach(property => obj[property.key] = property.value);
      return JSON.stringify(obj);
    }

  }

}
