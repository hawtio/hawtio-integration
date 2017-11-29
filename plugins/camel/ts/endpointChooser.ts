namespace Camel {

  /**
   * Define the default categories for endpoints and map them to endpoint names
   * @property
   * @for Camel
   * @type {Object}
   */
  export var endpointCategories = {
    bigdata: {
      label: "Big Data",
      endpoints: ["hdfs", "hbase", "lucene", "solr"],
      endpointIcon: "img/icons/camel/endpointRepository24.png"
    },
    database: {
      label: "Database",
      endpoints: ["couchdb", "elasticsearch", "hbase", "jdbc", "jpa", "hibernate", "mongodb", "mybatis", "sql"],
      endpointIcon: "img/icons/camel/endpointRepository24.png"
    },
    cloud: {
      label: "Cloud",
      endpoints: [
        "aws-cw", "aws-ddb", "aws-sdb", "aws-ses", "aws-sns", "aws-sqs", "aws-s3",
        "gauth", "ghhtp", "glogin", "gtask",
        "jclouds"]
    },
    core: {
      label: "Core",
      endpoints: ["bean", "direct", "seda"]
    },
    messaging: {
      label: "Messaging",
      endpoints: ["jms", "activemq", "amqp", "cometd", "cometds", "mqtt", "netty", "vertx", "websocket"],
      endpointIcon: "img/icons/camel/endpointQueue24.png"
    },
    mobile: {
      label: "Mobile",
      endpoints: ["apns"]
    },
    sass: {
      label: "SaaS",
      endpoints: ["salesforce", "sap-netweaver"]
    },
    social: {
      label: "Social",
      endpoints: ["atom", "facebook", "irc", "ircs", "rss", "smpp", "twitter", "weather"]
    },
    storage: {
      label: "Storage",
      endpointIcon: "img/icons/camel/endpointFolder24.png",
      endpoints: ["file", "ftp", "sftp", "scp", "jsch"]
    },
    template: {
      label: "Templating",
      endpoints: ["freemarker", "velocity", "xquery", "xslt", "scalate", "string-template"]
    }
  };

  /**
   * Maps endpoint names to a category object
   * @property
   * @for Camel
   * @type {Object}
   */
  export var endpointToCategory = {};

  export var endpointIcon = "img/icons/camel/endpoint24.png";
  /**
   *  specify custom label & icon properties for endpoint names
   * @property
   * @for Camel
   * @type {Object}
   */
  export var endpointConfigurations = {
    drools: {
      icon: "img/icons/camel/endpointQueue24.png"
    },
    quartz: {
      icon: "img/icons/camel/endpointTimer24.png"
    },
    facebook: {
      icon: "img/icons/camel/endpoints/facebook24.jpg"
    },
    salesforce: {
      icon: "img/icons/camel/endpoints/salesForce24.png"
    },
    sap: {
      icon: "img/icons/camel/endpoints/SAPe24.png"
    },
    "sap-netweaver": {
      icon: "img/icons/camel/endpoints/SAPNetweaver24.jpg"
    },
    timer: {
      icon: "img/icons/camel/endpointTimer24.png"
    },
    twitter: {
      icon: "img/icons/camel/endpoints/twitter24.png"
    },
    weather: {
      icon: "img/icons/camel/endpoints/weather24.jpg"
    }
  };

  /**
   * Define the default form configurations
   * @property
   * @for Camel
   * @type {Object}
   */
  export var endpointForms = {
    file: {
      tabs: {
        //'Core': ['key', 'value'],
        'Options': ['*']
      }
    },
    activemq: {
      tabs: {
        'Connection': ['clientId', 'transacted', 'transactedInOut', 'transactionName', 'transactionTimeout' ],
        'Producer': ['timeToLive', 'priority', 'allowNullBody', 'pubSubNoLocal', 'preserveMessageQos'],
        'Consumer': ['concurrentConsumers', 'acknowledgementModeName', 'selector', 'receiveTimeout'],
        'Reply': ['replyToDestination', 'replyToDeliveryPersistent', 'replyToCacheLevelName', 'replyToDestinationSelectorName'],
        'Options': ['*']
      }
    }
  };

  endpointForms["jms"] = endpointForms.activemq;

  angular.forEach(endpointCategories, (category, catKey) => {
    category['id'] = catKey;
    angular.forEach(category.endpoints, (endpoint) => {
      endpointToCategory[endpoint] = category;
    });
  });

  /**
   * Override the EIP pattern tabs...
   * @property
   * @for Camel
   * @type {Object}
   */
  var camelModelTabExtensions = {
    route: {
      'Overview': ['id', 'description'],
      'Advanced': ['*']
    }
  };

  export function getEndpointIcon(endpointName) {
    var value = Camel.getEndpointConfig(endpointName, null);
    var answer = Core.pathGet(value, ["icon"]);
    if (!answer) {
      var category = getEndpointCategory(endpointName);
      answer = Core.pathGet(category, ["endpointIcon"]);
    }
    return answer || endpointIcon;
  }

  export function getEndpointConfig(endpointName, category) {
    var answer = endpointConfigurations[endpointName];
    if (!answer) {
      answer = {
      };
      endpointConfigurations[endpointName] = answer;
    }
    if (!answer.label) {
      answer.label = endpointName;
    }
    if (!answer.icon) {
      answer.icon = Core.pathGet(category, ["endpointIcon"]) || endpointIcon;
    }
    if (!answer.category) {
      answer.category = category;
    }
    return answer;
  }

  export function getEndpointCategory(endpointName:string) {
    return endpointToCategory[endpointName] || endpointCategories.core;
  }

  export function getConfiguredCamelModel() {
    var schema = _apacheCamelModel;
    var definitions = schema["definitions"];
    if (definitions) {
      angular.forEach(camelModelTabExtensions, (tabs, name) => {
        var model = definitions[name];
        if (model) {
          if (!model["tabs"]) {
            model["tabs"] = tabs;
          }
        }
      });
    }
    return schema;
  }

  export function initEndpointChooserScope($scope, $location, localStorage: Storage, workspace: Jmx.Workspace, jolokia: Jolokia.IJolokia) {
    $scope.selectedComponentName = null;
    $scope.endpointParameters = {};
    $scope.endpointPath = "";

    $scope.schema = {
      definitions: {
      }
    };

    $scope.jolokia = jolokia;
    $scope.profileWorkspace = workspace;

    const silentOptions = { silent: true };

    $scope.$watch('selectedComponentName', () => {
      if ($scope.selectedComponentName !== $scope.loadedComponentName) {
        $scope.endpointParameters = {};
        $scope.loadEndpointSchema($scope.selectedComponentName);
        $scope.loadedComponentName = $scope.selectedComponentName;
      }
    });

    $scope.endpointCompletions = (completionText) => {
      var answer = null;
      const mbean = findCamelContextMBean();
      var componentName = $scope.selectedComponentName;
      var endpointParameters = {};
      if (mbean && componentName && completionText) {
        answer = $scope.jolokia.execute(mbean, 'completeEndpointPath', componentName, endpointParameters, completionText, Core.onSuccess(null, silentOptions));
      }
      return answer || [];
    };

    $scope.loadEndpointNames = () => {
      $scope.componentNames = null;
      const mbean = findCamelContextMBean();
      if (mbean) {
        $scope.jolokia.execute(mbean, 'findComponentNames', Core.onSuccess(onComponents, silentOptions));
      } else {
        console.log('WARNING: No camel context mbean so cannot load component names');
      }
    };

    $scope.loadEndpointSchema = (componentName) => {
      const mbean = findCamelContextMBean();
      if (mbean && componentName && componentName !== $scope.loadedEndpointSchema) {
        $scope.selectedComponentName = componentName;
        $scope.jolokia.execute(mbean, 'componentParameterJsonSchema', componentName, Core.onSuccess(onEndpointSchema, silentOptions));
      }
    };

    function onComponents(response) {
      $scope.componentNames = response;
      log.info("onComponents: " + response);
      $scope.hasComponentNames = $scope.componentNames ? true : false;
      Core.$apply($scope);
    }

    function onEndpointSchema(response) {
      if (response) {
        try {
          var json = JSON.parse(response);
          var endpointName = $scope.selectedComponentName;
          configureEndpointSchema(endpointName, json);
          $scope.endpointSchema = json;
          $scope.schema.definitions[endpointName] = json;
          $scope.loadedEndpointSchema = endpointName;
          Core.$apply($scope);
        } catch (e) {
          console.log("Failed to parse JSON " + e);
          console.log("JSON: " + response);
        }
      }
    }

    function configureEndpointSchema(endpointName, json) {
      var config = Camel.endpointForms[endpointName];
      if (config && json) {
        if (config.tabs) {
          json.tabs = config.tabs;
        }
      }
    }

    function findCamelContextMBean() {
      let profileWorkspace = $scope.profileWorkspace;
      if (!profileWorkspace) {
        var remoteJolokia = $scope.jolokia;
        if (remoteJolokia) {
          profileWorkspace = Jmx.createRemoteWorkspace(remoteJolokia, $location, localStorage);
          $scope.profileWorkspace = profileWorkspace;
        }
      }
      if (!profileWorkspace) {
        log.info("No profileWorkspace found so defaulting it to workspace for now");
        profileWorkspace = workspace;
      }

      // TODO we need to find the MBean for the CamelContext / Route we are editing!
      var componentName = $scope.selectedComponentName;
      var selectedCamelContextId;
      var selectedRouteId
      if (angular.isDefined($scope.camelSelectionDetails)) {
        selectedCamelContextId = $scope.camelSelectionDetails.selectedCamelContextId;
        selectedRouteId = $scope.camelSelectionDetails.selectedRouteId;
      }

      const contexts = Camel.camelContextMBeansById(profileWorkspace);
      if (selectedCamelContextId) {
        const context = contexts[selectedCamelContextId];
        if (context) {
          return context.objectName;
        }
      }
      if (selectedRouteId) {
        const map = Camel.camelContextMBeansByRouteId(profileWorkspace);
        const mbean = Core.pathGet(map, [selectedRouteId, 'mbean']);
        if (mbean) {
          return mbean;
        }
      }
      if (componentName) {
        const map = Camel.camelContextMBeansByComponentName(profileWorkspace);
        const mbean = Core.pathGet(map, [componentName, 'mbean']);
        if (mbean) {
          return mbean;
        }
      }

      // NOTE we don't really know which camel context to pick, so lets just find the first one?
      return _.first(_.values(contexts)).objectName;
    }
  }
}
