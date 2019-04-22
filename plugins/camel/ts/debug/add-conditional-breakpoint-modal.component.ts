namespace Camel {

  export class AddConditionalBreakpointModalController {
    close: () => void;
    resolve: { nodeId: string };
    conditionalBreakpoint = new ConditionalBreakpoint();
    error: string;

    constructor(private debugService: DebugService) {
      'ngInject';
    }

    add() {
      this.conditionalBreakpoint.nodeId = this.resolve.nodeId;
      this.debugService.addConditionalBreakpoint(this.conditionalBreakpoint)
        .then(this.close)
        .catch(error => this.error = error);
    }
  }

  export const addConditionalBreakpointModal: angular.IComponentOptions = {
    bindings: {
      close: '&',
      dismiss: '&',
      resolve: '<'
    },
    template: `
      <form name="addConditionalBreakpointForm" class="form-horizontal" ng-submit="$ctrl.add()">
        <div class="modal-header">
          <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()">
            <span class="pficon pficon-close" aria-hidden="true"></span>
          </button>
          <h4 class="modal-title">Add conditional breakpoint</h4>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger" ng-if="$ctrl.error">
            <span class="pficon pficon-error-circle-o"></span>
            {{ $ctrl.error }}
          </div>
          <div class="form-group">
            <label class="col-sm-2 control-label">Language</label>
            <div class="col-sm-10">
              <div class="radio">
                <label>
                  <input type="radio" ng-model="$ctrl.conditionalBreakpoint.language" value="simple">
                  Simple
                </label>
              </div>
              <div class="radio">
                <label>
                  <input type="radio" ng-model="$ctrl.conditionalBreakpoint.language" value="xpath">
                  XPath
                </label>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="col-sm-2 control-label" for="predicate">Predicate</label>
            <div class="col-sm-10">
              <input type="text" class="form-control" id="predicate" name="predicate"
                     ng-model="$ctrl.conditionalBreakpoint.predicate" ng-disabled="!$ctrl.conditionalBreakpoint.language">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
          <button type="submit" class="btn btn-primary" ng-disabled="!$ctrl.conditionalBreakpoint.predicate">Add</button>
        </div>
      </form>
    `,
    controller: AddConditionalBreakpointModalController
  };
}
