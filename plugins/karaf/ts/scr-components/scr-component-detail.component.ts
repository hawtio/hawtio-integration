/// <reference path="scr-component.ts"/>
/// <reference path="scr-components.service.ts"/>

namespace Karaf {

  export class ScrComponentDetailController {

    component: ScrComponent;
    srcComponentsUrl: string = Core.url('/osgi/scr-components' + this.workspace.hash());
    loading = true;
    scrMBean: string = getSelectionScrMBean(this.workspace);

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

    disableComponentEnable(): boolean {
      return this.component == undefined || this.component.state === 'Enabled';
    }

    enableComponent(): void {
      this.scrComponentsService.enableComponent(this.component)
        .then(response => {
          Core.notification('success', response);
          this.loadComponent();
        })
        .catch(error => Core.notification('danger', error));
    }

    disableComponentDisable(): boolean {
      return this.component == undefined || this.component.state !== 'Enabled';
    }

    disableComponent(): void {
      this.scrComponentsService.disableComponent(this.component)
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
