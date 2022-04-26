namespace Runtime {

  export class ThreadDumpModalController {
    resolve: {dumpedThreads: string};

    get dumpedThreads() {
      console.log(this.resolve.dumpedThreads);
      return this.resolve.dumpedThreads;
    }
  }

  export const threadDumpModalComponent: angular.IComponentOptions = {
    bindings: {
      resolve: '<',
      close: '&'
    },
    template: `

<h1> Thread Dump </h1>
$ctrl.dumpThreads

    `,
    controller: ThreadDumpModalController
  };
}
