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
  <div class="modal-body" ng-repeat="thread in $ctrl.dumpedThreads">
    <h4><b> General Information</b> </h4>
    <div class="row">
    <div class="col-md-12">
      <dl class="dl-horizontal">
        <dt>ID</dt>
        <dd>{{thread.threadId}}</dd>
        <dt>Name</dt>
        <dd>{{thread.threadName}}</dd>
        <dt>Daemon</dt>
        <dd>{{thread.daemon ? 'yes' : 'no'}}</dd>
      <h4><b> Execution Information</b> </h4>
      <dt>State</dt>
      <dd>{{thread.threadState}}</dd>
      <dt>Priority</dt>
      <dd>{{thread.priority}}</dd>
      <div ng-show="thread.lockOwnerId > 0">
      <dt>Waiting for lock owned by</dt>
      <dd><a href="" ng-click="selectThreadById(thread.lockOwnerId)">{{$thread.lockOwnerId}} - {{thread.lockOwnerName}}</a></dd>
    </div>
    <div class="row" ng-if="thread.stackTrace.length > 0">
    <div class="col-md-12">
      <dl>
        <dt>Stack Trace</dt>
        <dd>
          <ol>
            <li ng-repeat="frame in thread.stackTrace">
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
    <div class="row" ng-if="thread.lockedMonitors.length > 0">
    <div class="col-md-12">
      <dl>
        <dt>Locked Monitors</dt>
        <dd>
          <ol>
            <li ng-repeat="monitor in thread.lockedMonitors">
              Frame: <strong>{{monitor.lockedStackDepth}}</strong>
              <span class="green">{{monitor.lockedStackFrame.className}}</span>
              <span class="bold">.</span>
              <span class="blue bold">{{monitor.lockedStackFrame.methodName}}</span>
              ({{monitor.lockedStackFrame.fileName}}<span ng-show="frame.lineNumber > 0">:{{monitor.lockedStackFrame.lineNumber}}</span>)
              <span class="orange" ng-show="monitor.lockedStackFrame.nativeMethod">(Native)</span>
            </li>
          </ol>
        </dd>
      </dl>
    </div>
    <div ng-show="$ctrl.thread.lockedSynchronizers.length > 0">
              <dt>Locked Synchronizers</dt>
              <dd>
                <ol class="list-unstyled">
                  <li ng-repeat="synchronizer in $ctrl.thread.lockedSynchronizers">
                    <span title="Class Name">{{synchronizer.className}}</span> -
                    <span title="Identity Hash Code">{{synchronizer.identityHashCode}}</span>
                  </li>
                </ol>
            </dd>
    </div>
    <h4><b>Synchornization Information </b> </h4>
    <dt>Waited Count</dt>
    <dd>{{thread.waitedCount}}</dd>
    <dt ng-show="thread.waitedTime">Waited Time</dt>
    <dd ng-show="thread.waitedTime">{{thread.waitedTime}}</dd>
  </div>
  </div>
    `,
    controller: ThreadDumpModalController
  };
}
