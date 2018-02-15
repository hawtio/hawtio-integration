namespace Camel {

  export class Endpoint {

    constructor(public uri: string, public state: string, public mbean: string) {
      'ngInject';
    }

  }

}
