/// <reference path="connect.service.ts"/>

namespace JVM {

  class ConnectController {
    connections: ConnectOptions[] = [];
    promise: ng.IPromise<any>;

    listConfig = {
      selectionMatchProp: 'name',
      selectItems: false,
      showSelectBox: false
    };

    listActionButtons = [
      { name: 'Connect', actionFn: (action, connection) => this.connect(connection) }
    ];

    listActionDropDown = [
      { name: 'Edit', actionFn: (action, connection) => this.editConnection(connection) },
      { name: 'Delete', actionFn: (action, connection) => this.deleteConnection(connection) }
    ];

    constructor(private $timeout: ng.ITimeoutService,
      private $uibModal: angular.ui.bootstrap.IModalService,
      private connectService: ConnectService) {
      'ngInject';
    }

    $onInit() {
      this.connections = this.connectService.getConnections();
      this.connectService.updateReachableFlags(this.connections);
      this.setTimerToUpdateReachableFlags();
    }

    $onDestroy() {
      this.$timeout.cancel(this.promise);
    }

    setTimerToUpdateReachableFlags() {
      this.promise = this.$timeout(() => {
        this.connectService.updateReachableFlags(this.connections)
          .then(connections => this.setTimerToUpdateReachableFlags());
      }, 20000);
    }

    addConnection() {
      const defaultOptions = this.connectService.getDefaultOptions();
      this.$uibModal.open({
        component: 'connectEditModal',
        resolve: {
          connection: () => createConnectOptions(defaultOptions),
          connectionNames: () => this.connections.map(conn => conn.name)
        },
      })
      .result.then(connection => {
        this.connections.unshift(connection);
        this.connectService.saveConnections(this.connections);
        this.connectService.updateReachableFlag(connection);
      });
    }

    private editConnection(connection: ConnectOptions) {
      const clone = angular.extend({}, connection);
      this.$uibModal.open({
        component: 'connectEditModal',
        resolve: {
          connection: () => clone,
          connectionNames: () => this.connections
            .filter(conn => conn.name !== clone.name)
            .map(conn => conn.name)
        },
      })
      .result.then(clone => {
        angular.extend(connection, clone);
        this.connectService.saveConnections(this.connections);
        this.connectService.updateReachableFlag(connection);
      });
    }

    private deleteConnection(connection: ConnectOptions) {
      this.$uibModal.open({
        component: 'connectDeleteModal'
      })
      .result.then(() => {
        this.connections = _.without(this.connections, connection);
        this.connectService.saveConnections(this.connections);
      });
    }

    private connect(connection: ConnectOptions) {
      if (connection.reachable) {
        this.connectService.connect(connection);
      } else {
        this.$uibModal.open({
          component: 'connectUnreachableModal'
        });
      }
    }
  }

  export const connectComponent: angular.IComponentOptions = {
    templateUrl: 'plugins/jvm/html/connect.html',
    controller: ConnectController
  };

}
