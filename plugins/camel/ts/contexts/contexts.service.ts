/// <reference path="context.ts"/>

namespace Camel {

  export class ContextsService {
    
    constructor(private $q: ng.IQService, private jolokia: Jolokia.IJolokia) {
      'ngInject';
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
            let context = new Context(object.CamelId, object.State, object.ManagementName);
            contexts.push(context);
            if (contexts.length === requests.length) {
              resolve(contexts);
            }
          }
        }, {
          error: (response) => {
            log.debug('ContextsService.getContexts() failed: ' + response.error);
            reject(response.error);
          }
        });
      });
    }

    startContexts(contexts: Context[]): ng.IPromise<Context[]> {
      return this.executeOperationOnContexts('start()', contexts);
    }

    suspendContexts(contexts: Context[]): ng.IPromise<Context[]> {
      return this.executeOperationOnContexts('suspend()', contexts);
    }

    deleteContexts(contexts: Context[]): ng.IPromise<Context[]> {
      return this.executeOperationOnContexts('stop()', contexts);
    }

    executeOperationOnContexts(operation: string, contexts: Context[]): ng.IPromise<Context[]> {
      if (contexts.length === 0) {
        return this.$q.resolve([]);
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
            log.debug('ContextsService.executeOperationOnContexts() failed: ' + response.error);
            reject(response.error);
          }
        });
      });
    }

  }

}
