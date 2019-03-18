namespace Jmx {

  export class HeaderController {
    title: string;
    objectName: string;

    constructor($scope) {
      'ngInject';
      $scope.$on('jmxTreeClicked', (event, selectedNode: NodeSelection) => {
        this.title = selectedNode.text;
        this.objectName = selectedNode.objectName;
      });
    }
  }

  export const headerComponent: angular.IComponentOptions = {
    template: `
      <div class="jmx-header">
        <header>
          <h1>{{$ctrl.title}}</h1>
          <p class="text-muted">{{$ctrl.objectName}}</p>
        </header>
      </div>
      `,
    controller: HeaderController
  };

}
