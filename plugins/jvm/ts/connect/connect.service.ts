/// <reference path="../jvmHelpers.ts"/>

namespace JVM {

  export class ConnectService {

    constructor(private $q: ng.IQService, private $window: ng.IWindowService, private $location: ng.ILocationService) {
      'ngInject';
    }

    getConnections(): ConnectOptions[] {
      const connectionsJson = this.$window.localStorage.getItem(connectionSettingsKey);
      return connectionsJson ? JSON.parse(connectionsJson) : [];
    }

    updateReachableFlags(connections: ConnectOptions[]): ng.IPromise<ConnectOptions[]> {
      const promises = connections.map(connection => this.testConnection(connection));
      return this.$q.all(promises)
        .then(results => {
          for (let i = 0; i < connections.length; i++) {
            connections[i].reachable = results[i].ok;
          }
          return connections;
        });
    }

    updateReachableFlag(connection: ConnectOptions): ng.IPromise<ConnectOptions> {
      return this.testConnection(connection)
        .then(result => {
          connection.reachable = result.ok;
          return connection;
        });
    }

    saveConnections(connections: ConnectOptions[]) {
      this.$window.localStorage.setItem(connectionSettingsKey, JSON.stringify(connections));
    }

    testConnection(connection: ConnectOptions): ng.IPromise<ConnectionTestResult> {
      return this.$q((resolve, reject) => {
        try {
          new Jolokia({
            url: createServerConnectionUrl(connection),
            method: 'post',
            mimeType: 'application/json'
          }).request({
            type: 'version'
          }, {
              success: () => {
                resolve({ ok: true, message: 'Connection successful' });
              },
              ajaxError: (response: JQueryXHR) => {
                let result: ConnectionTestResult;
                if (response.status === 403) {
                  const forbiddenReason = response.responseJSON && response.responseJSON['reason'];
                  if (forbiddenReason === 'HOST_NOT_ALLOWED') {
                    result = { ok: false, message: 'Host not whitelisted' }
                  } else {
                    result = { ok: true, message: 'Connection successful' }
                  }
                } else {
                  result = { ok: false, message: 'Connection failed' }
                }
                resolve(result);
              }
            });
        } catch (error) {
          log.error(error);
        }
      });
    };

    checkCredentials(connection: ConnectOptions, username: string, password: string): ng.IPromise<boolean> {
      return this.$q((resolve, reject) => {
        new Jolokia({
          url: createServerConnectionUrl(connection),
          method: 'post',
          mimeType: 'application/json',
          username: username,
          password: password
        }).request({
          type: 'version'
        }, {
            success: () => {
              resolve(true);
            },
            ajaxError: () => {
              resolve(false);
            }
          });
      });
    };

    connect(connection: ConnectOptions) {
      log.debug("Connecting with options: ", StringHelpers.toString(connection));
      const url = URI('').search({ con: connection.name }).toString();
      this.$window.open(url);
    }

    getDefaultOptions(): ConnectOptions {
      return {
        port: this.getBrowserUrlPortNumber(),
        path: this.getBrowserUrlContextPath() + '/jolokia'
      };
    }

    private getBrowserUrlPortNumber(): number {
      let port = null;
      try {
        const uri = URI(this.$location.absUrl());
        if (uri.port()) {
          port = parseInt(uri.port());
        }
      } catch (error) {
        log.error(error);
      }
      return port;
    }

    private getBrowserUrlContextPath(): string {
      let contextPath = null;
      try {
        const uri = URI(this.$location.absUrl());
        const uriPath = uri.path();
        const locationPath = this.$location.path();
        contextPath = uriPath.slice(0, uriPath.indexOf(locationPath));
      } catch (error) {
        log.error(error);
      }
      return contextPath;
    }

  }

}
