/// <reference path="context.ts"/>

namespace Camel {

  export class ContextsService {

    private log: Logging.Logger = Logger.get("Camel");
    
    constructor(private jolokiaService: JVM.JolokiaService, private treeService: Jmx.TreeService) {
      'ngInject';
    }

    getContexts(): ng.IPromise<Context[]> {
      return this.treeService.getSelectedMBean()
        .then((nodeSelection: Jmx.NodeSelection) => {
          if (nodeSelection.children) {
            const mbeanNames = nodeSelection.children.filter(node => node.objectName).map(node => node.objectName);
            return this.jolokiaService.getMBeans(mbeanNames)
              .then(mbeans => mbeans.map((mbean, i) => new Context(mbean.CamelId, mbean.State, mbeanNames[i])));
          } else {
            return [];
          }
        });
    }
    
    getContext(mbeanName: string): ng.IPromise<Context> {
      return this.jolokiaService.getMBean(mbeanName)
        .then(mbean => new Context(mbean.CamelId, mbean.State, mbeanName));
    }

    startContext(context: Context): ng.IPromise<any> {
      return this.executeOperationOnContext('start()', context);
    }

    startContexts(contexts: Context[]): ng.IPromise<any[]> {
      return this.executeOperationOnContexts('start()', contexts);
    }

    suspendContext(context: Context): ng.IPromise<any> {
      return this.executeOperationOnContext('suspend()', context);
    }

    suspendContexts(contexts: Context[]): ng.IPromise<any[]> {
      return this.executeOperationOnContexts('suspend()', contexts);
    }

    stopContext(context: Context): ng.IPromise<any> {
      return this.executeOperationOnContext('stop()', context);
    }

    stopContexts(contexts: Context[]): ng.IPromise<any[]> {
      return this.executeOperationOnContexts('stop()', contexts);
    }

    executeOperationOnContext(operation: string, context: Context): ng.IPromise<any> {
      return this.jolokiaService.execute(context.mbeanName, operation);
    }
    
    executeOperationOnContexts(operation: string, contexts: Context[]): ng.IPromise<any[]> {
      const objectNames = contexts.map(context => context.mbeanName);
      return this.jolokiaService.executeMany(objectNames, operation);
    }
  }

}
