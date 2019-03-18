namespace JVM {

  export class ConnectEditModalController {

    modalInstance: any;
    operation: 'add' | 'edit';
    resolve: { connection:ConnectOptions, connectionNames: string[] };
    connection: ConnectOptions;
    errors = {};
    connectionTestResult: ConnectionTestResult;
    connectionNames: string[];

    constructor(private connectService: ConnectService) {
      'ngInject';
    }

    $onInit() {
      this.connection = this.resolve.connection;
      this.connectionNames = this.resolve.connectionNames;
      this.operation = this.connection.name ? 'edit' : 'add';
    }

    testConnection(connection: ConnectOptions) {
      this.errors = this.validateConnection(connection);

      if (Object.keys(this.errors).length === 0) {
        this.connectService.testConnection(connection)
          .then(connectionTestResult => this.connectionTestResult = connectionTestResult);
      }
    };

    cancel() {
      this.modalInstance.dismiss();
    }

    saveConnection(connection) {
      this.errors = this.validateConnection(connection);

      if (Object.keys(this.errors).length === 0) {
        this.modalInstance.close(this.connection);
      }
    }

    private validateConnection(connection: ConnectOptions): {} {
      let errors = {};
      if (connection.name === null || connection.name.trim().length === 0) {
        errors['name'] = 'Please fill out this field';
      }
      if(this.connectionNames.indexOf(connection.name.trim()) >= 0) {
        errors['name'] = `Connection name '${connection.name.trim()}' is already in use`;
      }
      if (connection.host === null || connection.host.trim().length === 0) {
        errors['host'] = 'Please fill out this field';
      }
      if (connection.port !== null && connection.port < 0 || connection.port > 65535) {
        errors['port'] = 'Please enter a number from 0 to 65535';
      }
      return errors;
    }
  }

  export const connectEditModalComponent: angular.IComponentOptions = {
    bindings: {
      modalInstance: '<',
      resolve: '<'
    },
    templateUrl: 'plugins/jvm/html/connect-edit.html',
    controller: ConnectEditModalController
  };

}
