namespace Camel {

  export class Route {

    selected = false;

    constructor(public name: string, public state: string, public mbean: string) {
    }

    isStarted() {
      return this.state === 'Started';
    }

    isStopped() {
      return this.state === 'Stopped';
    }

  }

}
