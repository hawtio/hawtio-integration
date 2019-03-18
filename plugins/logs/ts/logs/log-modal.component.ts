namespace Logs {

  export class LogModalController {
    resolve: {logEntry: LogEntry};

    get logEntry() {
      return this.resolve.logEntry;
    }
  }

  export const logModalComponent: angular.IComponentOptions = {
    bindings: {
      resolve: '<',
      close: '&'
    },
    template: `
      <div class="modal-header">
        <button type="button" class="close" aria-label="Close" ng-click="$ctrl.close()">
          <span class="pficon pficon-close" aria-hidden="true"></span>
        </button>
        <h4 class="modal-title">Log</h4>
      </div>
      <div class="modal-body">
        <dl class="dl-horizontal">
          <dt>Timestamp</dt>
          <dd>{{$ctrl.logEntry | logDateFilter}}</dd>
          <dt>Level</dt>
          <dd class="{{$ctrl.logEntry.levelClass}}">{{$ctrl.logEntry.level}}</dd>
          <dt>Logger</dt>
          <dd>{{$ctrl.logEntry.logger}}</dd>
          <div ng-show="$ctrl.logEntry.hasLogSourceLineHref">
            <dt>Class</dt>
            <dd>{{$ctrl.logEntry.className}}</dd>
            <dt>Method</dt>
            <dd>{{$ctrl.logEntry.methodName}}</dd>
            <dt>File</dt>
            <dd>{{$ctrl.logEntry.fileName}}:{{$ctrl.logEntry.lineNumber}}</dd>
          </div>
          <div ng-show="$ctrl.logEntry.host">
            <dt>Host</dt>
            <dd>{{$ctrl.logEntry.host}}</dd>
          </div>
          <dt>Thread</dt>
          <dd>{{$ctrl.logEntry.thread}}</dd>
          <dt>Message</dt>
          <dd ng-bind-html="$ctrl.logEntry.sanitizedMessage"></dd>
        </dl>
        <dl ng-if="$ctrl.logEntry.exception">
          <dt>Stack Trace</dt>
          <dd>
            <ul class="list-unstyled">
              <li ng-repeat="frame in $ctrl.logEntry.exception" class="log-jmx-stacktrace-list-item">{{frame}}</li>
            </ul>
          </dd>
        </dl>
        <div ng-show="$ctrl.logEntry.hasOSGiProps">
          <h4>OSGi Properties</h4>
          <dl class="dl-horizontal">
            <div ng-show="$ctrl.logEntry.properties['bundle.name']">
              <dt>Bundle Name</dt>
              <dd>{{$ctrl.logEntry.properties['bundle.name']}}</dd>
            </div>
            <div ng-show="$ctrl.logEntry.properties['bundle.id']">
              <dt>Bundle ID</dt>
              <dd>{{$ctrl.logEntry.properties['bundle.id']}}</dd>
            </div>
            <div ng-show="$ctrl.logEntry.properties['bundle.version']">
              <dt>Bundle Version</dt>
              <dd>{{$ctrl.logEntry.properties['bundle.version']}}</dd>
            </div>
          </dl>
        </div>
        <div ng-show="$ctrl.logEntry.hasMDCProps">
          <h4>MDC Properties</h4>
          <dl class="dl-horizontal">
            <dt ng-repeat-start="(key, value) in $ctrl.logEntry.mdcProperties">{{key}}</dt>
            <dd ng-repeat-end>{{value}}</dt>
          </dl>
        </div>
      </div>
    `,
    controller: LogModalController
  };

}
