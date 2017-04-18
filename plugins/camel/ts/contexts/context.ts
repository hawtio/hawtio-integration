namespace Camel {

  export class Context {

    selected = false;

    constructor(public name: string, public state: string, public managementName: string) {
    }

    get mbean() {
      return `org.apache.camel:context=${this.managementName},type=context,name="${this.name}"`;
    }

  }

}
