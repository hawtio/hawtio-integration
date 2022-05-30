namespace Runtime {

  export class ThreadDumpModalController {
    resolve: { dumpedThreads: string; };

    get dumpedThreads() {
      return this.resolve.dumpedThreads;
    }
  }

  export const threadDumpModalComponent: angular.IComponentOptions = {
    bindings: {
      resolve: '<',
      close: '&'
    },
    template: `
      <div class="modal-header">
        <button type="button" class="close" aria-label="Close" ng-click="$ctrl.close()">
          <span class="pficon pficon-close" aria-hidden="true"></span>
        </button>
        <h4 class="modal-title">Thread Dump</h4>
      </div>
      <div class="modal-body">
        <div class="row">
          <div class="col-md-12">
              <pre class="thread-dump-modal-output">{{$ctrl.dumpedThreads}}</pre>
          </div>
        </div>
      </div>
    `,
    controller: ThreadDumpModalController
  };
}
