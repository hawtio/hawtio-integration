namespace Camel {

  export class Context {

    selected = false;

    constructor(public name: string, public state: string, public mbean: string) {
    }

  }

}
