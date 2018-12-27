namespace Camel {

  export class Route {

    selected = false;

    constructor(
      public name: string,
      public state: string,
      public mbean: string,
      public uptime: string,
      public exchangesCompleted: number,
      public exchangesFailed: number,
      public failuresHandled: number,
      public exchangesTotal: number,
      public exchangesInflight: number,
      public meanProcessingTimeMillis: number) {
    }

    get meanProcessingTime() {
      return this.meanProcessingTimeMillis + ' ms';
    }

    isStarted() {
      return this.state === 'Started';
    }

    isStopped() {
      return this.state === 'Stopped';
    }

  }

}
