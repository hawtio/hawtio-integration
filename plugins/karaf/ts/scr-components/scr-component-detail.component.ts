/// <reference path="scr-component.ts"/>
/// <reference path="scr-components.service.ts"/>

namespace Karaf {

  export class ScrComponentDetailController {

    private component:ScrComponent;
    private srcComponentsUrl:string = Core.url('/osgi/scr-components' + this.workspace.hash());
    private loading = true;
    
    constructor(private scrComponentsService: ScrComponentsService,
                private $routeParams: angular.route.IRouteParamsService,
                private workspace: Jmx.Workspace) {
      'ngInject';
    }

    $onInit() {
      this.loadComponent();
    }

    private loadComponent() {
      this.scrComponentsService.getComponents().then(components => {
        this.component = components.filter(component => {
          return component.name === this.$routeParams['name']
        })[0];
        this.loading = false;
      })
    }

    disableActivate() {
      return this.component == undefined || this.component.state === 'Active';
    }

    activateComponent() {
      this.scrComponentsService.activateComponent(this.component)
        .then(response => {
          Core.notification('success', response);
          this.loadComponent();
        })
        .catch(error => Core.notification('danger', error));
    }

    disableDeactivate() {
      return this.component == undefined || this.component.state !== 'Active';
    }

    deactivateComponent() {
      this.scrComponentsService.deactivateComponent(this.component)
      .then(response => {
        Core.notification('success', response);
        this.loadComponent();
      })
      .catch(error => Core.notification('danger', error));
  }
  }

  export const scrDetailComponent: angular.IComponentOptions = {
    templateUrl: 'plugins/karaf/html/scr-component.html',
    controller: ScrComponentDetailController
  };
}
