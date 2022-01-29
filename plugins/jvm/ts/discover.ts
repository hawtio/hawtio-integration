/// <reference path="jvmPlugin.ts"/>

namespace JVM {

  _module.controller("JVM.DiscoveryController", ["$scope", "localStorage", "jolokia", ($scope, localStorage, jolokia) => {

    $scope.jvmDiscovery = {
      discovering : true,
      responseJson : undefined,
      agents : <any>undefined,
      selectedAgent: undefined,
      filter: undefined
    };

    $scope.$watch('jvmDiscovery.agents', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        $scope.jvmDiscovery.selectedAgent = _.find($scope.jvmDiscovery.agents, a => a['selected']);
      }
    }, true);

    $scope.closePopover = ($event) => {
      (<any>$)($event.currentTarget).parents('.popover').hide();
    };

    function getMoreJvmDetails(agents) {
      for (let key in agents) {
        const agent = agents[key];
        if (agent.url && !agent.secured) {
          const dedicatedJolokia = createJolokia(agent.url, agent.username, agent.password);
          agent.startTime = dedicatedJolokia.getAttribute('java.lang:type=Runtime', 'StartTime');
          agent.command = dedicatedJolokia.getAttribute('java.lang:type=Runtime', 'SystemProperties', 'sun.java.command');
        }
      }
    }

    function doConnect(agent) {
      if (!agent.url) {
        Core.notification('warning', 'No URL available to connect to agent');
        return;
      }
      const options = createConnectOptions();
      options.name = agent.agent_description || 'discover-' + agent.agent_id;
      const urlObject = Core.parseUrl(agent.url);
      angular.extend(options, urlObject);
      options.userName = agent.username;
      options.password = agent.password;
      connectToServer(localStorage, options);
    }

    $scope.connectWithCredentials = ($event, agent) => {
      $scope.closePopover($event);
      doConnect(agent);
    };

    $scope.gotoServer = ($event, agent) => {
      if (agent.secured) {
        (<any>$)($event.currentTarget).popover('show');
      } else {
        doConnect(agent);
      }
    };

    $scope.getElementId = (agent) => {
      return agent.agent_id.dasherize().replace(/\./g, "-");
    };

    $scope.getLogo = (agent) => {
      if (JVM.logoRegistry[agent.server_product]) {
        return JVM.logoRegistry[agent.server_product];
      }
      return JVM.logoRegistry['generic'];
    };

    $scope.filterMatches = (agent) => {
      if (Core.isBlank($scope.jvmDiscovery.filter)) {
        return true;
      } else {
        const needle = $scope.jvmDiscovery.filter.toLowerCase();
        const haystack = angular.toJson(agent).toLowerCase();
        return haystack.indexOf(needle) > -1;
      }
    };

    $scope.getAgentIdClass = (agent) => {
      if ($scope.hasName(agent)) {
        return "";
      }
      return "strong";
    };

    $scope.hasName = (agent) => {
      return !!(agent.server_vendor && agent.server_product && agent.server_version);
    };

    $scope.render = (response) => {
      $scope.jvmDiscovery.discovering = false;
      if (response) {
        const responseJson = angular.toJson(response, true);
        if ($scope.jvmDiscovery.responseJson !== responseJson) {
          $scope.jvmDiscovery.responseJson = responseJson;
          $scope.jvmDiscovery.agents = response;
          getMoreJvmDetails($scope.jvmDiscovery.agents);
        }
      }
      Core.$apply($scope);
    };

    $scope.fetch = () => {
      $scope.jvmDiscovery.discovering = true;
      // use 10 sec timeout
      jolokia.execute('jolokia:type=Discovery', 'lookupAgentsWithTimeout(int)', 10 * 1000, Core.onSuccess($scope.render));
    };

    $scope.fetch();
  }]);

}
