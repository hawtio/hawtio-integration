/// <reference path="operation.ts"/>
/// <reference path="../../../rbac/ts/models.ts"/>

namespace Jmx {

  export class OperationsService {

    constructor(private $q: ng.IQService, private jolokia: Jolokia.IJolokia, private jolokiaUrl: string,
      private workspace: Jmx.Workspace, private treeService: TreeService, private rbacACLMBean: ng.IPromise<string>) {
      'ngInject';
    }

    getOperations(): ng.IPromise<Operation[]> {
      return this.treeService.getSelectedMBeanName()
        .then(mbeanName => mbeanName ? this.fetchOperations(mbeanName) : []);
    }

    private fetchOperations(mbeanName: string): ng.IPromise<Operation[]> {
      return this.$q((resolve, reject) => {
        this.jolokia.request(
          {
            type: 'list',
            path: Core.escapeMBeanPath(mbeanName)
          },
          Core.onSuccess(
            (response) => {
              let operations = [];
              let operationMap = {};
              _.forEach(response.value.op, (op: any, opName: string) => {
                if (_.isArray(op)) {
                  _.forEach(op, (op) =>
                    this.addOperation(operations, operationMap, opName, op)
                  );
                } else {
                  this.addOperation(operations, operationMap, opName, op);
                }
              });
              operations = _.sortBy(operations, operation => operation.readableName);
              if (!_.isEmpty(operationMap)) {
                this.fetchPermissions(operationMap, mbeanName)
                  .then(() => resolve(operations));
              } else {
                resolve(operations);
              }
            },
            {
              error: (response) =>
                log.debug('OperationsService.loadOperations() failed:', response)
            }));
      });
    }

    private addOperation(operations: Operation[], operationMap: { [name: string]: Operation },
      opName: string, op: { args: any[], desc: string }): void {
      let operation = new Operation(
        opName,
        op.args.map((arg) => _.assign(new OperationArgument(), arg)),
        op.desc);
      operations.push(operation);
      operationMap[operation.name] = operation;
    }

    private fetchPermissions(operationMap: { [name: string]: Operation }, mbeanName: string): ng.IPromise<void> {
      return this.$q((resolve, reject) =>
        this.rbacACLMBean.then((rbacACLMBean) => {
          if (!rbacACLMBean) {
            // Client-side RBAC is not available
            resolve();
          }
          this.jolokia.request(
            {
              type: 'exec',
              mbean: rbacACLMBean,
              operation: 'canInvoke(java.util.Map)',
              arguments: [{ [mbeanName]: _.values(operationMap).map((op) => op.name) }]
            },
            Core.onSuccess(
              (response) => {
                log.debug("rbacACLMBean canInvoke operations response:", response);
                let ops = response.value;
                _.forEach(ops[mbeanName], (canInvoke: RBAC.OperationCanInvoke, opName: string) => {
                  operationMap[opName].canInvoke = canInvoke.CanInvoke;
                });
                log.debug("Got operations:", operationMap);
                resolve();
              },
              {
                error: (response) =>
                  log.debug('OperationsService.fetchPermissions() failed:', response)
              }
            )
          );
        }));
    }

    executeOperation(mbeanName: string, operation: Operation, argValues: any[] = []): ng.IPromise<string> {
      return this.$q((resolve, reject) => {
        this.jolokia.execute(mbeanName, operation.name, ...argValues,
          {
            success: (response) => {
              if (response === null || response === 'null') {
                resolve('Operation Succeeded!');
              } else if (typeof response === 'string') {
                if (response.trim() === '') {
                  resolve('Empty string');
                } else {
                  resolve(response);
                }
              } else {
                resolve(angular.toJson(response, true));
              }
            },
            error: (response) => reject(response.stacktrace ? response.stacktrace : response.error)
          });
      });
    };

    buildJolokiaUrl(operation: Operation): string {
      let mbeanName = Core.escapeMBean(this.workspace.getSelectedMBeanName());
      return `${this.jolokiaUrl}/exec/${mbeanName}/${operation.name}`;
    }
  }

}
