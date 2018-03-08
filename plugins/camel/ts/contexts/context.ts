namespace Camel {

  export class Context {

    selected = false;

    constructor(public name: string, public state: string, public mbeanName: string) {
    }

    isStarted() {
      return this.state === 'Started';
    }

    isSuspended() {
      return this.state === 'Suspended';
    }

  }

}
