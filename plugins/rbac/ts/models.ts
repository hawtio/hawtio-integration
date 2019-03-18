/**
 * @namespace RBAC
 */
namespace RBAC {

  export interface RBACTasks extends Core.Tasks {
    initialize(mbean: string): void;
    getACLMBean(): ng.IPromise<string>;
  }

  export interface OperationCanInvoke {
    CanInvoke: boolean;
    Method: string;
    ObjectName: string;
  }

}
