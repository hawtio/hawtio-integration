namespace Camel {

  export class CamelTreeService {

    constructor(private treeService: Jmx.TreeService) {
      'ngInject';
    }

    getSelectedRouteId(): ng.IPromise<string> {
      return this.treeService.getSelectedMBean()
        .then(mbean => mbean.entries.type === 'routes' ? Core.trimQuotes(mbean.entries.name) : null);
    }
  }
}
