/// <reference path="camelPlugin.ts"/>
/// <reference path="camelHeaderSchema.ts"/>
/// <reference path="jmsHeaderSchema.ts"/>

namespace Camel {

   var DELIVERY_PERSISTENT = "2";

  _module.controller("Camel.SendMessageController", ["$route", "$scope", "$element", "$timeout", "workspace", "jolokia", "localStorage", "$location", "activeMQMessage", (
      $route: angular.route.IRouteService,
      $scope,
      $element,
      $timeout: ng.ITimeoutService,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia,
      localStorage: Storage,
      $location: ng.ILocationService,
      activeMQMessage) => {

    var log: Logging.Logger = Logger.get("Camel");

    $scope.noCredentials = false;
    $scope.container = {};
    $scope.message = "";
    $scope.headers = [];

    // bind model values to search params...
    Core.bindModelToSearchParam($scope, $location, "tab", "subtab", "compose");
    Core.bindModelToSearchParam($scope, $location, "searchText", "q", "");

    // only reload the page if certain search parameters change
    Core.reloadWhenParametersChange($route, $scope, $location);

    $scope.checkCredentials = () => {
      $scope.noCredentials = (Core.isBlank(localStorage['activemqUserName']) || Core.isBlank(localStorage['activemqPassword']));
    };

    if ($location.path().indexOf('activemq') > -1) {
      $scope.localStorage = localStorage;
      $scope.$watch('localStorage.activemqUserName', $scope.checkCredentials);
      $scope.$watch('localStorage.activemqPassword', $scope.checkCredentials);

        //prefill if it's a resent
        if(activeMQMessage.message !== null){
           $scope.message = activeMQMessage.message.bodyText;
           if( activeMQMessage.message.PropertiesText !== null){
               for( var p in activeMQMessage.message.StringProperties){
                   $scope.headers.push({name: p, value: activeMQMessage.message.StringProperties[p]});
               }
           }
        }
        // always reset at the end
        activeMQMessage.message = null;
    }

    $scope.openPrefs = () => {
      $location.path('/preferences').search({'pref': 'ActiveMQ'});
    };

    var LANGUAGE_FORMAT_PREFERENCE = "defaultLanguageFormat";
    var sourceFormat = workspace.getLocalStorage(LANGUAGE_FORMAT_PREFERENCE) || "javascript";

    $scope.codeMirrorOptions = CodeEditor.createEditorSettings({
      mode: {
        name: sourceFormat
      }
    });

    $scope.$on('hawtioEditor_default_instance', (event, codeMirror) => {
      $scope.codeMirror = codeMirror;
    });

    $scope.addHeader = () => {
      $scope.headers.push({name: "", value: ""});
    };

    $scope.removeHeader = (header) => {
      let index = $scope.headers.indexOf(header);
      $scope.headers.splice(index, 1);
    };

    $scope.defaultHeaderNames = () => {
      var answer = [];

      function addHeaderSchema(schema) {
        angular.forEach(schema.definitions.headers.properties, (value, name) => {
          answer.push(name);
        });
      }

      if (isJmsEndpoint()) {
        addHeaderSchema(Camel.jmsHeaderSchema);
      }
      if (isCamelEndpoint()) {
        addHeaderSchema(Camel.camelHeaderSchema);
      }
      return answer;
    };

    /* save the sourceFormat in preferences for later
     * Note, this would be controller specific preferences and not the global, overriding, preferences */
      // TODO Use ng-selected="changeSourceFormat()" - Although it seemed to fire multiple times..
    $scope.$watch('codeMirrorOptions.mode.name', function (newValue, oldValue) {
      workspace.setLocalStorage(LANGUAGE_FORMAT_PREFERENCE, newValue)
    });

    var sendWorked = () => {
      $scope.message = "";
      Core.notification("success", "Message sent!");
    };

    $scope.formatMessage = () => {
      CodeEditor.autoFormatEditor($scope.codeMirror);
    };

    $scope.sendMessage = () => {
      var body = $scope.message;
      doSendMessage(body, sendWorked);
    };


    function doSendMessage(body, onSendCompleteFn) {
      var selection = workspace.selection;
      if (selection) {
        var mbean = selection.objectName;
        if (mbean) {
          var headers = null;
          if ($scope.headers.length) {
            headers = {};
            angular.forEach($scope.headers, (object) => {
              var key = object.name;
              if (key) {
                headers[key] = object.value;
              }
            });
            log.info("About to send headers: " + JSON.stringify(headers));
          }

          var callback = Core.onSuccess(onSendCompleteFn);
          if (selection.domain === "org.apache.camel") {
            var target = Camel.getContextAndTargetEndpoint(workspace);
            var uri = target['uri'];
            mbean = target['mbean'];
            if (mbean && uri) {

              // if we are running Camel 2.14 we can check if its possible to send to the endpoint
              var ok = true;
              if (Camel.isCamelVersionEQGT(2, 14, workspace, jolokia)) {
                var reply = jolokia.execute(mbean, "canSendToEndpoint(java.lang.String)", uri);
                if (!reply) {
                  Core.notification("warning", "Camel does not support sending to this endpoint.");
                  ok = false;
                }
              }

              if (ok) {
                if (headers) {
                  jolokia.execute(mbean, "sendBodyAndHeaders(java.lang.String, java.lang.Object, java.util.Map)", uri, body, headers, callback);
                } else {
                  jolokia.execute(mbean, "sendStringBody(java.lang.String, java.lang.String)", uri, body, callback);
                }
              }
            } else {
              if (!mbean) {
                Core.notification("error", "Could not find CamelContext MBean!");
              } else {
                Core.notification("error", "Failed to determine endpoint name!");
              }
              log.debug("Parsed context and endpoint: ", target);
            }
          } else {
            var user = localStorage["activemqUserName"];
            var pwd = localStorage["activemqPassword"];

            // AMQ is sending non persistent by default, so make sure we tell to sent persistent by default
            if (!headers) {
              headers = {};
            }
            if (!headers["JMSDeliveryMode"]) {
              headers["JMSDeliveryMode"] = DELIVERY_PERSISTENT;
            }

            jolokia.execute(mbean, "sendTextMessage(java.util.Map, java.lang.String, java.lang.String, java.lang.String)", headers, body, user, pwd, callback);
          }
        }
      }
    }

    function isCamelEndpoint() {
      // TODO check for the camel or if its an activemq endpoint
      return true;
    }

    function isJmsEndpoint() {
      // TODO check for the jms/activemq endpoint in camel or if its an activemq endpoint
      return true;
    }

  }]);
}
