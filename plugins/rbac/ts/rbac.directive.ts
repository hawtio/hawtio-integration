/// <reference path="../../jmx/ts/workspace.ts"/>

namespace RBAC {

  const MBEAN_ONLY = 'canInvoke(java.lang.String)';
  const OVERLOADED_METHOD = 'canInvoke(java.lang.String,java.lang.String)';
  const EXACT_METHOD = 'canInvoke(java.lang.String,java.lang.String,[Ljava.lang.String;)';

  const HIDE = 'hide';
  const REMOVE = 'remove';
  const INVERSE = 'inverse';

  /**
   * Directive that sets an element's visibility to hidden if the user cannot invoke the supplied operation
   */
  export class HawtioShow implements ng.IDirective {

    restrict: string;

    constructor(private workspace: Jmx.Workspace) {
      this.restrict = 'A';
    }

    static factory(workspace: Jmx.Workspace): HawtioShow {
      'ngInject';
      return new HawtioShow(workspace);
    }

    link(scope: ng.IScope, element: ng.IAugmentedJQuery, attr: ng.IAttributes): void {
      let objectName = attr['objectName'];
      let objectNameModel = attr['objectNameModel'];
      log.debug("hawtio-show: object-name=", objectName, "object-name-model=", objectNameModel);
      if (!objectName && !objectNameModel) {
        return;
      }

      if (objectName) {
        this.applyInvokeRights(element, objectName, attr);
      } else {
        scope.$watch<string>(objectNameModel, (newValue, oldValue) => {
          if (newValue && newValue !== oldValue) {
            this.applyInvokeRights(element, newValue, attr);
          }
        });
      }
    }

    private applyInvokeRights(element: ng.IAugmentedJQuery, objectName: string, attr: ng.IAttributes): void {
      let methodName = attr['methodName'];
      let argumentTypes = attr['argumentTypes'];
      let mode = attr['mode'] || HIDE;
      let canInvokeOp = this.getCanInvokeOperation(methodName, argumentTypes);
      let args = this.getArguments(canInvokeOp, objectName, methodName, argumentTypes);
      let mbean = Core.parseMBean(objectName);
      let folder = this.workspace.findMBeanWithProperties(mbean.domain, mbean.attributes);
      if (!folder) {
        return;
      }
      let invokeRights = methodName ?
        this.workspace.hasInvokeRights(folder, methodName) :
        this.workspace.hasInvokeRights(folder);
      this.changeDisplay(element, invokeRights, mode);
    }

    private getCanInvokeOperation(methodName: string, argumentTypes: string): string {
      let answer = MBEAN_ONLY;
      if (!Core.isBlank(methodName)) {
        answer = OVERLOADED_METHOD;
      }
      if (!Core.isBlank(argumentTypes)) {
        answer = EXACT_METHOD;
      }
      return answer;
    }

    private getArguments(canInvokeOp: string, objectName: string, methodName: string,
      argumentTypes: string): string[] {
      let args = [];
      if (canInvokeOp === MBEAN_ONLY) {
        args.push(objectName);
      } else if (canInvokeOp === OVERLOADED_METHOD) {
        args.push(objectName);
        args.push(methodName);
      } else if (canInvokeOp === EXACT_METHOD) {
        args.push(objectName);
        args.push(methodName);
        args.push(argumentTypes.split(',').map((s) => s.trim()));
      }
      return args;
    }

    private changeDisplay(element: ng.IAugmentedJQuery, invokeRights: boolean, mode: string): void {
      if (invokeRights) {
        if (mode === INVERSE) {
          element.css({ display: 'none' });
        }
      } else {
        if (mode === REMOVE) {
          element.css({ display: 'none' });
        } else if (mode === HIDE) {
          element.css({ visibility: 'hidden' });
        }
      }
    }
  }

}
