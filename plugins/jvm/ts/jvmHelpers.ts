/// <reference path="jvmGlobals.ts"/>

namespace JVM {

  /**
   * Adds common properties and functions to the scope
   * @method configureScope
   * @for Jvm
   * @param {*} $scope
   * @param {ng.ILocationService} $location
   * @param {Core.Workspace} workspace
   */
  export function configureScope($scope, $location, workspace) {

    $scope.isActive = (href) => {
      const tidy = Core.trimLeading(href, "#");
      const loc = $location.path();
      return loc === tidy;
    };

    $scope.isValid = (link) => {
      return link && link.isValid(workspace);
    };

    $scope.hasLocalMBean = () => {
      return JVM.hasLocalMBean(workspace);
    };

    $scope.goto = (path) => {
      $location.path(path);
    };
  }

  export function hasLocalMBean(workspace) {
    return workspace.treeContainsDomainAndProperties('hawtio', { type: 'JVMList' });
  }

  export function hasDiscoveryMBean(workspace) {
    return workspace.treeContainsDomainAndProperties('jolokia', { type: 'Discovery' });
  }

  /**
   * Creates a jolokia object for connecting to the container with the given remote jolokia URL,
   * username and password
   * @method createJolokia
   * @for Core
   * @static
   * @param {String} url
   * @param {String} username
   * @param {String} password
   * @return {Object}
   */
  export function createJolokia(url: string, username: string, password: string) {
    const jolokiaParams: Jolokia.IParams = {
      url: url,
      username: username,
      password: password,
      canonicalNaming: false, ignoreErrors: true, mimeType: 'application/json'
    };
    return new Jolokia(jolokiaParams);
  }

  export function getRecentConnections(localStorage) {
    if (Core.isBlank(localStorage['recentConnections'])) {
      clearConnections();
    }
    return angular.fromJson(localStorage['recentConnections']);
  }

  export function addRecentConnection(localStorage, name) {
    let recent = getRecentConnections(localStorage);
    recent.push(name);
    recent = _.take(_.uniq(recent), 5);
    localStorage['recentConnections'] = angular.toJson(recent);
  }

  export function removeRecentConnection(localStorage, name) {
    let recent = getRecentConnections(localStorage);
    recent = _.without(recent, name);
    localStorage['recentConnections'] = angular.toJson(recent);
  }

  export function clearConnections() {
    localStorage['recentConnections'] = '[]';
  }

  export function isRemoteConnection() {
    return ('con' in new URI().query(true));
  }

  export function connectToServer(localStorage, options: ConnectOptions) {
    log.debug("Connecting with options: ", StringHelpers.toString(options));
    const clone = angular.extend({}, options);
    addRecentConnection(localStorage, clone.name);
    if (!('userName' in clone)) {
      const userDetails = <Core.UserDetails>HawtioCore.injector.get('userDetails');
      clone.userName = userDetails.username;
      clone.password = userDetails.password;
    }
    //must save to local storage, to be picked up by new tab
    saveConnection(clone);
    const $window: ng.IWindowService = HawtioCore.injector.get<ng.IWindowService>('$window');
    let url = (clone.view || '/') + '?con=' + clone.name;
    url = url.replace(/\?/g, "&");
    url = url.replace(/&/, "?");
    const newWindow = $window.open(url, clone.name);
    newWindow['con'] = clone.name;
    newWindow['userDetails'] = {
      username: clone.userName,
      password: clone.password,
      loginDetails: {}
    };
  }

  export function saveConnection(options: ConnectOptions) {
    const connections = loadConnections();

    let existingIndex = _.findIndex(connections, (element) => { return element.name === options.name });
    if (existingIndex != -1) {
      connections[existingIndex] = options;
    } else {
      connections.unshift(options);
    }
    saveConnections(connections);
  }

  /**
   * Loads all of the available connections from local storage
   */
  export function loadConnections(): ConnectOptions[] {
    const localStorage = Core.getLocalStorage();
    try {
      const connections: ConnectOptions[] = angular.fromJson(localStorage[connectionSettingsKey]);
      if (!connections) {
        // nothing found on local storage
        return [];
      } else if (!_.isArray(connections)) {
        // found the legacy connections map
        delete localStorage[connectionSettingsKey];
        return [];
      } else {
        // found a valid connections array
        return connections;
      }
    } catch (e) {
      // corrupt config
      delete localStorage[connectionSettingsKey];
      return [];
    }
  }

  /**
   * Saves the connection map to local storage
   * @param connections array of all connections to be stored
   */
  export function saveConnections(connections: ConnectOptions[]) {
    log.debug("Saving connection array:", StringHelpers.toString(connections));
    localStorage[connectionSettingsKey] = angular.toJson(connections);
  }

  export function getConnectionNameParameter() {
    return new URI().search(true)['con'];
  }

  /**
   * Returns the connection options for the given connection name from localStorage
   */
  export function getConnectOptions(name: string, localStorage = Core.getLocalStorage()): ConnectOptions {
    if (!name) {
      return null;
    }
    let connections = loadConnections();
    return _.find(connections, connection => connection.name === name);
  }

  /**
   * Creates the Jolokia URL string for the given connection options
   */
  export function createServerConnectionUrl(options: ConnectOptions): string {
    log.debug("Connect to server, options:", StringHelpers.toString(options));
    let answer: string = null;
    if (options.jolokiaUrl) {
      answer = options.jolokiaUrl;
    }
    if (answer === null) {
      const uri = new URI();
      uri.protocol(options.scheme || 'http')
        .host(options.host || 'localhost')
        .port(String(options.port || 80))
        .path(options.path);

      answer = UrlHelpers.join('proxy', uri.protocol(), uri.hostname(), uri.port(), uri.path());
    }
    log.debug("Using URL:", answer);
    return answer;
  }


}
