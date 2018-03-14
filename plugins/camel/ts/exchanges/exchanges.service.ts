namespace Camel {

  export class ExchangesService {

    constructor(private jolokiaService: JVM.JolokiaService, private treeService: Jmx.TreeService,
      private workspace: Jmx.Workspace) {
      'ngInject';
    }
    
    getInflightExchanges(): ng.IPromise<any[]> {
      return this.getExchanges('DefaultInflightRepository*');
    }
    
    getBlockedExchanges(): ng.IPromise<any[]> {
      return this.getExchanges('DefaultAsyncProcessorAwaitManager*');
    }

    private getExchanges(serviceName: string): ng.IPromise<any[]> {
      return this.treeService.findMBeanWithProperties('org.apache.camel', {type: 'services', name: serviceName})
        .then(mbean => {
          return this.jolokiaService.execute(mbean.objectName, 'browse()')
            .then(response => {
              let exchanges = _.values(response);
                    
              // if the selected tree node is a route then keep only the exchanges related to that route
              var routeId = getSelectedRouteId(this.workspace);
              if (routeId != null) {
                exchanges = _.filter(exchanges, {'routeId': routeId});
              }

              exchanges = _.sortBy(exchanges, "exchangeId");
              return exchanges;
            });
        });
    }

    unblockExchange(exchange) {
      log.info("Unblocking thread (" + exchange.id + "/" + exchange.name + ") for exchangeId: " + exchange.exchangeId);
      return this.treeService.findMBeanWithProperties('org.apache.camel', {type: 'services', name: 'DefaultAsyncProcessorAwaitManager*'})
        .then(mbean => {
          return this.jolokiaService.execute(mbean.objectName, 'interrupt(java.lang.String)', exchange.exchangeId);
        });
    }
  }

}
