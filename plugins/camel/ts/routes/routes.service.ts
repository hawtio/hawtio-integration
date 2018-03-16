/// <reference path="route.ts"/>

namespace Camel {

  export class RoutesService {

    constructor(private jolokiaService: JVM.JolokiaService) {
      'ngInject';
    }

    getRoute(objectName: string): ng.IPromise<Route> {
      return this.jolokiaService.getMBean(objectName)
        .then(mbean => new Route(mbean.RouteId, mbean.State, objectName));
    }

    getRoutes(objectNames: string[]): ng.IPromise<Route[]> {
      return this.jolokiaService.getMBeans(objectNames)
        .then(mbeans => mbeans.map((mbean, i) => new Route(mbean.RouteId, mbean.State, objectNames[i])));
    }

    startRoute(route: Route): ng.IPromise<any> {
      return this.startRoutes([route]);
    }

    startRoutes(routes: Route[]): ng.IPromise<any> {
      return this.executeOperationOnRoutes('start()', routes);
    }

    stopRoute(route: Route): ng.IPromise<any> {
      return this.stopRoutes([route]);
    }

    stopRoutes(routes: Route[]): ng.IPromise<any> {
      return this.executeOperationOnRoutes('stop()', routes);
    }

    removeRoute(route: Route): ng.IPromise<any> {
      return this.removeRoutes([route]);
    }

    removeRoutes(routes: Route[]): ng.IPromise<any> {
      return this.executeOperationOnRoutes('remove()', routes);
    }

    executeOperationOnRoutes(operation: string, routes: Route[]): ng.IPromise<any> {
      const objectNames = routes.map(route => route.mbean);
      return this.jolokiaService.executeMany(objectNames, operation);
    }
  }

}
