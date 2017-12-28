/// <reference path="route.ts"/>

namespace Camel {

  export class RoutesService {

    constructor(private $q: ng.IQService, private jolokia: Jolokia.IJolokia) {
      'ngInject';
    }

    getRoute(mbean: string): ng.IPromise<Route> {
      let request = {
        type: "read",
        mbean: mbean,
        ignoreErrors: true
      };

      return this.$q((resolve, reject) => {
        this.jolokia.request(request, {
          success: response => {
            let object = response.value;
            let route = new Route(object.RouteId, object.State, response.request.mbean);
            resolve(route);
          }
        }, {
          error: response => {
            log.error('RoutesService.getRoute() failed: ' + response.error);
            reject(response.error);
          }
        });
      });
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
          success: response => {
            let object = response.value;
            let route = new Route(object.RouteId, object.State, mbeans[routes.length]);
            routes.push(route);
            if (routes.length === requests.length) {
              resolve(routes);
            }
          }
        }, {
          error: response => {
            log.error('RoutesService.getRoutes() failed: ' + response.error);
            reject(response.error);
          }
        });
      });
    }

    startRoute(route: Route): ng.IPromise<String> {
      return this.startRoutes([route]);
    }

    startRoutes(routes: Route[]): ng.IPromise<String> {
      return this.executeOperationOnRoutes('start()', routes);
    }

    stopRoute(route: Route): ng.IPromise<String> {
      return this.stopRoutes([route]);
    }

    stopRoutes(routes: Route[]): ng.IPromise<String> {
      return this.executeOperationOnRoutes('stop()', routes);
    }

    removeRoute(route: Route): ng.IPromise<String> {
      return this.removeRoutes([route]);
    }

    removeRoutes(routes: Route[]): ng.IPromise<String> {
      return this.executeOperationOnRoutes('remove()', routes);
    }

    executeOperationOnRoutes(operation: string, routes: Route[]): ng.IPromise<String> {
      if (routes.length === 0) {
        return this.$q.resolve('success');
      }

      let requests = routes.map(route => ({
        type: 'exec',
        operation: operation,
        mbean: route.mbean
      }));
      
      return this.$q((resolve, reject) => {
        let responseCount = 0;
        this.jolokia.request(requests, {
          success: response => {
            responseCount++;
            if (responseCount === requests.length) {
              resolve('success');
            }
          }
        }, {
          error: response => {
            log.error('RoutesService.executeOperationOnRoutes() failed: ' + response.error);
            reject(response.error);
          }
        });
      });
    }

  }

}
