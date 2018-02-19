/// <reference path="endpoint.ts"/>

namespace Camel {

  export class EndpointsService {

    constructor(
      private $q: ng.IQService,
      private jolokiaService: JVM.JolokiaService,
      private workspace: Jmx.Workspace) {
      'ngInject';
    }

    getEndpoints(): ng.IPromise<Endpoint[]> {
      if (this.workspace.selection && this.workspace.selection.children && this.workspace.selection.children.length > 0) {
        let mbeans = this.workspace.selection.children.map(node => node.objectName);
        return this.jolokiaService.readMany(mbeans)
          .then(objects => objects.map((object, i) => new Endpoint(object.EndpointUri, object.State, mbeans[i])));
      } else {
        return this.$q.resolve([]);
      }
    }

    canCreateEndpoints(): boolean {
      return this.workspace.selection &&
        this.workspace.hasInvokeRights(this.workspace.selection, "createEndpoint");
    }

  }

}
