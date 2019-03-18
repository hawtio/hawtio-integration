/// <reference path="jvmPlugin.ts"/>

/**
 * @module JVM
 */
namespace JVM {

  _module.controller("JVM.JVMsController", ["$scope", "$location", "localStorage", "workspace", "jolokia", "mbeanName", ($scope, $location, localStorage: Storage, workspace, jolokia, mbeanName) => {

    JVM.configureScope($scope, $location, workspace);
    $scope.data = [];
    $scope.deploying = false;
    $scope.status = '';
    $scope.initDone = false;
    $scope.filter = '';
    const listRequest = {
      type: 'exec', mbean: mbeanName,
      operation: 'listLocalJVMs()',
      arguments: []
    };

    $scope.filterMatches = (jvm) => {
      if (Core.isBlank($scope.filter)) {
        return true;
      } else {
        return jvm.alias.toLowerCase().has($scope.filter.toLowerCase());
      }
    };

    $scope.fetch = () => {
      jolokia.request(listRequest, {
        success: render,
        error: (response) => {
          $scope.data = [];
          $scope.initDone = true;
          $scope.status = 'Could not discover local JVM processes: ' + response.error;
          Core.$apply($scope);
        }
      });
    };

    $scope.stopAgent = (pid) => {
      jolokia.request([{
        type: 'exec', mbean: mbeanName,
        operation: 'stopAgent(java.lang.String)',
        arguments: [pid]
      }, listRequest], Core.onSuccess(renderIfList));
    };

    $scope.startAgent = (pid) => {
      jolokia.request([{
        type: 'exec', mbean: mbeanName,
        operation: 'startAgent(java.lang.String)',
        arguments: [pid]
      }, listRequest], Core.onSuccess(renderIfList));
    };

    $scope.connectTo = (url, scheme, host, port, path) => {
      // we only need the port and path from the url, as we got the rest
      const options: ConnectOptions = {
        scheme: scheme,
        host: host,
        port: port,
        path: path
      };

      const con = createConnectOptions(options);
      con.name = "local-" + port;

      log.debug("Connecting to local JVM agent: " + url);
      connectToServer(localStorage, con);
      Core.$apply($scope);
    };

    /**
     * Since the requests are bundled, check the operation in callback to decide on
     * how to respond to success
     */
    function renderIfList(response) {
      if (response.request.operation.indexOf("listLocalJVMs") > -1) {
        render(response);
      }
    }

    function render(response) {
      $scope.initDone = true;
      $scope.data = response.value;
      if ($scope.data.length === 0) {
        $scope.status = 'Could not discover local JVM processes';
      }
      Core.$apply($scope);
    }

    $scope.fetch();
  }]);

}
