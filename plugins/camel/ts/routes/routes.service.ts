/// <reference path="route.ts"/>

namespace Camel {

  export class RoutesService {

    private Operation = {
      START: 'start()',
      STOP: 'stop()',
      DELETE: 'remove()'
    };

    constructor(private jolokiaService: JVM.JolokiaService, private workspace: Jmx.Workspace) {
      'ngInject';
    }

    getRoute(objectName: string): ng.IPromise<Route> {
      return this.jolokiaService.getMBean(objectName)
        .then(mbean => this.buildRoute(mbean, objectName));
    }

    getRoutes(objectNames: string[]): ng.IPromise<Route[]> {
      return this.jolokiaService.getMBeans(objectNames)
        .then(mbeans => mbeans.map((mbean, i) => this.buildRoute(mbean, objectNames[i])));
    }

    private buildRoute(mbean, objectName): Route {
      return new Route(mbean.RouteId, mbean.State, objectName, mbean.Uptime, mbean.ExchangesCompleted,
        mbean.ExchangesFailed, mbean.FailuresHandled, mbean.ExchangesTotal, mbean.ExchangesInflight,
        mbean.MeanProcessingTime);
    }

    startRoute(route: Route): ng.IPromise<any> {
      return this.startRoutes([route]);
    }

    startRoutes(routes: Route[]): ng.IPromise<any> {
      return this.executeOperationOnRoutes(this.Operation.START, routes);
    }

    stopRoute(route: Route): ng.IPromise<any> {
      return this.stopRoutes([route]);
    }

    stopRoutes(routes: Route[]): ng.IPromise<any> {
      return this.executeOperationOnRoutes(this.Operation.STOP, routes);
    }

    removeRoute(route: Route): ng.IPromise<any> {
      return this.removeRoutes([route]);
    }

    removeRoutes(routes: Route[]): ng.IPromise<any> {
      return this.executeOperationOnRoutes(this.Operation.DELETE, routes);
    }

    private executeOperationOnRoutes(operation: string, routes: Route[]): ng.IPromise<any> {
      const objectNames = routes.map(route => route.mbean);
      return this.jolokiaService.executeMany(objectNames, operation);
    }

    canStartRoutes(routes: Route[]): boolean {
      return this.canExecuteOperationOnRoutes(this.Operation.START, routes);
    }

    canStopRoutes(routes: Route[]): boolean {
      return this.canExecuteOperationOnRoutes(this.Operation.STOP, routes);
    }

    canDeleteRoutes(routes: Route[]): boolean {
      return this.canExecuteOperationOnRoutes(this.Operation.DELETE, routes);
    }

    private canExecuteOperationOnRoutes(operation: string, routes: Route[]): boolean {
      return _.every(routes, route => this.workspace.hasInvokeRightsForName(route.mbean, operation));
    }
  }

}
