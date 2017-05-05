/// <reference path="../../../includes.ts"/>
/// <reference path="route.ts"/>

namespace Camel {

  export class RoutesService {
    
    constructor(private $q: ng.IQService, private jolokia: Jolokia.IJolokia) {
      'ngInject';
    }

    getRoutes(mbeans: string[]): ng.IPromise<Route[]> {
      if (mbeans.length === 0) {
        return this.$q.resolve([]);
      }

      let requests = mbeans.map(mbean => ({
        type: "read",
        mbean: mbean,
        ignoreErrors: true
      }));

      return this.$q((resolve, reject) => {
        let routes = [];
        this.jolokia.request(requests, {
          success: function(response) {
            let object = response.value;
            let route = new Route(object.RouteId, object.State, object.CamelManagementName);
            routes.push(route);
            if (routes.length === requests.length) {
              resolve(routes);
            }
          }
        }, {
          error: (response) => {
            reject(response.error);
          }
        });
      });
    }

    startRoutes(routes: Route[]): ng.IPromise<Route[]> {
      return this.executeOperationOnRoutes('start()', routes);
    }

    stopRoutes(routes: Route[]): ng.IPromise<Route[]> {
      return this.executeOperationOnRoutes('stop()', routes);
    }

    removeRoutes(routes: Route[]): ng.IPromise<Route[]> {
      return this.executeOperationOnRoutes('remove()', routes);
    }

    executeOperationOnRoutes(operation: string, routes: Route[]): ng.IPromise<Route[]> {
      if (routes.length === 0) {
        return this.$q.resolve([]);
      }

      let requests = routes.map(route => ({
        type: 'exec',
        operation: operation,
        mbean: route.mbean
      }));
      
      return this.$q((resolve, reject) => {
        let responseCount = 0;
        this.jolokia.request(requests, {
          success: function(response) {
            responseCount++;
            if (responseCount === requests.length) {
              resolve('success');
            }
          }
        }, {
          error: (response) => {
            reject(response.error);
          }
        });
      });
    }

  }

}
