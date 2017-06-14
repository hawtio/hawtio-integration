/// <reference path="context.ts"/>

namespace Camel {

  export class ContextsService {

    private log: Logging.Logger = Logger.get("Camel");
    
    constructor(private $q: ng.IQService, private jolokia: Jolokia.IJolokia) {
      'ngInject';
    }

    getContext(mbean: string): ng.IPromise<Context> {
      let request = {
        type: "read",
        mbean: mbean,
        ignoreErrors: true
      };

      return this.$q((resolve, reject) => {
        let contexts = [];
        this.jolokia.request(request, {
          success: function(response) {
            let object = response.value;
            let context = new Context(object.CamelId, object.State, response.request.mbean);
            resolve(context);
          }
        }, {
          error: (response) => {
            this.log.debug('ContextsService.getContext() failed: ' + response.error);
            reject(response.error);
          }
        });
      });
    }

    getContexts(mbeans: string[]): ng.IPromise<Context[]> {
      if (mbeans.length === 0) {
        return this.$q.resolve([]);
      }

      let requests = mbeans.map(mbean => ({
        type: "read",
        mbean: mbean,
        ignoreErrors: true
      }));

      return this.$q((resolve, reject) => {
        let contexts = [];
        this.jolokia.request(requests, {
          success: function(response) {
            let object = response.value;
            let context = new Context(object.CamelId, object.State, response.request.mbean);
            contexts.push(context);
            if (contexts.length === requests.length) {
              resolve(contexts);
            }
          }
        }, {
          error: (response) => {
            this.log.debug('ContextsService.getContexts() failed: ' + response.error);
            reject(response.error);
          }
        });
      });
    }

    startContext(context: Context): ng.IPromise<String> {
      return this.startContexts([context]);
    }

    startContexts(contexts: Context[]): ng.IPromise<String> {
      return this.executeOperationOnContexts('start()', contexts);
    }

    suspendContext(context: Context): ng.IPromise<String> {
      return this.suspendContexts([context]);
    }

    suspendContexts(contexts: Context[]): ng.IPromise<String> {
      return this.executeOperationOnContexts('suspend()', contexts);
    }

    stopContext(context: Context): ng.IPromise<String> {
      return this.stopContexts([context]);
    }

    stopContexts(contexts: Context[]): ng.IPromise<String> {
      return this.executeOperationOnContexts('stop()', contexts);
    }

    executeOperationOnContexts(operation: string, contexts: Context[]): ng.IPromise<String> {
      if (contexts.length === 0) {
        return this.$q.resolve('success');
      }

      let requests = contexts.map(context => ({
        type: 'exec',
        operation: operation,
        mbean: context.mbean
      }));
      
      return this.$q((resolve, reject) => {
        let contexts = [];
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
            this.log.debug('ContextsService.executeOperationOnContexts() failed: ' + response.error);
            reject(response.error);
          }
        });
      });
    }

  }

}
