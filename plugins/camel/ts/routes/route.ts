namespace Camel {

  export class Route {

    selected = false;

    constructor(public name: string, public state: string, public managementName: string) {
    }

    get mbean() {
      return `org.apache.camel:context=${this.managementName},type=routes,name="${this.name}"`;
    }

  }

}
