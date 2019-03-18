/// <reference path="../workspace.ts"/>
/// <reference path="operations.service.ts"/>
/// <reference path="operation.ts"/>

namespace Jmx {

  export class OperationsController {
    operations: Operation[];

    config = {
      showSelectBox: false,
      useExpandingRows: true
    };

    menuActions = [
      {
        name: 'Copy method name',
        actionFn: (action, item: Operation) => {
          let clipboard = new Clipboard('.jmx-operations-list-view .dropdown-menu a', {
            text: (trigger) => item.readableName
          });
          setTimeout(() => clipboard.destroy(), 1000);
          Core.notification('success', 'Method name copied');
        }
      },
      {
        name: 'Copy Jolokia URL',
        actionFn: (action, item: Operation) => {
          let clipboard = new Clipboard('.jmx-operations-list-view .dropdown-menu a', {
            text: (trigger) => this.operationsService.buildJolokiaUrl(item)
          });
          setTimeout(() => clipboard.destroy(), 1000);
          Core.notification('success', 'Jolokia URL copied');
        }
      }
    ];

    constructor(private operationsService: OperationsService) {
      'ngInject';
    }

    $onInit() {
      this.operationsService.getOperations()
        .then(operations => this.operations = operations);
    }
  }

  export const operationsComponent: angular.IComponentOptions = {
    templateUrl: 'plugins/jmx/html/operations/operations.html',
    controller: OperationsController
  };

}
