namespace Runtime {

  export class ThreadDumpModalController {
    resolve: {dumpedThreads: Thread[]};

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
  <div class="modal-body" ng-repeat="item in $ctrl.dumpedThreads">
  <div class="row" ng-if="item.stackTrace.length > 0">
  <div class="col-md-12">
    <dl>
      <dt>Stack Trace of thereadId {{item.threadId}}</dt>
      <dd>
        <ol>
          <li ng-repeat="frame in item.stackTrace">
            <span class="green">{{frame.className}}</span>
            <span class="bold">.</span>
            <span class="blue bold">{{frame.methodName}}</span>
            ({{frame.fileName}}<span ng-show="frame.lineNumber > 0">:{{frame.lineNumber}}</span>)
            <span class="orange" ng-show="frame.nativeMethod">(Native)</span>
          </li>
        </ol>
      </dd>
    </dl>
  </div>
  </div>
    `,
    controller: ThreadDumpModalController
  };
}
