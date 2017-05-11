namespace Camel {

  export class Route {

    selected = false;

    constructor(public name: string, public state: string, public mbean: string) {
    }

  }

}
