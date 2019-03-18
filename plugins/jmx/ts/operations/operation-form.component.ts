/// <reference path="../workspace.ts"/>
/// <reference path="operations.service.ts"/>
/// <reference path="operation.ts"/>

namespace Jmx {

  export class OperationFormController {

    operation: Operation;
    formFields: { label: string, type: string, helpText: string, value: any }[];
    editorMode = 'text';
    operationFailed: boolean;
    operationResult: string;
    isExecuting: boolean = false;

    constructor(private workspace: Workspace, private operationsService: OperationsService) {
      'ngInject';
    }

    $onInit() {
      this.formFields = this.operation.args.map(arg => ({
        label: arg.name,
        type: OperationFormController.convertToHtmlInputType(arg.type),
        helpText: OperationFormController.buildHelpText(arg),
        value: OperationFormController.getDefaultValue(arg.type)
      }));
    }

    private static buildHelpText(arg: OperationArgument) {
      if (arg.desc && arg.desc !== arg.name) {
        if (arg.desc.charAt(arg.desc.length - 1) !== '.') {
          arg.desc = arg.desc + '.';
        }
        arg.desc = arg.desc + ' ';
      } else {
        arg.desc = '';
      }
      return arg.desc + 'Type: ' + arg.readableType();
    }

    private static convertToHtmlInputType(javaType: string): string {
      switch (javaType) {
        case 'boolean':
        case 'java.lang.Boolean':
          return 'checkbox';
        case 'int':
        case 'long':
        case 'java.lang.Integer':
        case 'java.lang.Long':
          return 'number';
        default:
          return 'text';
      }
    }

    private static getDefaultValue(javaType: string): any {
      switch (javaType) {
        case 'boolean':
        case 'java.lang.Boolean':
          return false;
        case 'int':
        case 'long':
        case 'java.lang.Integer':
        case 'java.lang.Long':
          return 0;
        default:
          return '';
      }
    }

    execute() {
      this.isExecuting = true;
      let mbeanName = this.workspace.getSelectedMBeanName();
      let argValues = this.formFields.map(formField => formField.value);
      this.operationsService.executeOperation(mbeanName, this.operation, argValues)
        .then(result => {
          this.operationFailed = false;
          this.operationResult = result.trim();
          this.isExecuting = false;
        })
        .catch(error => {
          this.operationFailed = true;
          this.operationResult = error.trim();
          this.isExecuting = false;
        });
    }

  }

  export const operationFormComponent: angular.IComponentOptions = {
    bindings: {
      operation: '<'
    },
    templateUrl: 'plugins/jmx/html/operations/operation-form.html',
    controller: OperationFormController
  };

}
