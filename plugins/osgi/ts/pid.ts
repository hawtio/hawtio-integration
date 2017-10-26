/// <reference path="osgiHelpers.ts"/>
/// <reference path="osgiPlugin.ts"/>
/// <reference path="metadata.ts"/>

namespace Osgi {

  _module.controller("Osgi.PidController", ["$scope", "$timeout", "$routeParams", "$location", "workspace", "jolokia", "$uibModal", (
      $scope,
      $timeout: ng.ITimeoutService,
      $routeParams: angular.route.IRouteParamsService,
      $location: ng.ILocationService,
      workspace: Jmx.Workspace,
      jolokia: Jolokia.IJolokia,
      $uibModal) => {

    let uibModalInstance = null;

    $scope.configurationUrl = Core.url('/osgi/configurations' + workspace.hash());
    $scope.factoryPid = $routeParams['factoryPid'];
    $scope.pid = $routeParams['pid'];
    $scope.createForm = {
      pidInstanceName: null
    };
    $scope.newPid = $scope.factoryPid && !$scope.pid;
    if ($scope.newPid) {
      $scope.editMode = true;
    }

    if ($scope.pid && !$scope.factoryPid) {
      var idx = $scope.pid.indexOf("-");
      if (idx > 0) {
        $scope.factoryPid = $scope.pid.substring(0, idx);
        $scope.factoryInstanceName = $scope.pid.substring(idx + 1, $scope.pid.length);
      }
    }

    $scope.selectValues = {};
    $scope.modelLoaded = false;
    $scope.canSave = false;

    const addPropertyAction = {
      name: 'Add property',
      actionFn: action => {
        uibModalInstance = $uibModal.open({
          templateUrl: 'addPropertyDialog.html',
          scope: $scope
        });      
      }
    }

    const editPropertiesAction = {
      name: 'Edit properties',
      actionFn: action => {
        if (Object.keys($scope.entity).length > 0) {
          $scope.editMode = true;
        }
      },
      isDisabled: true
    }

    $scope.toolbarConfig = {
      actionsConfig: {
        primaryActions: [
          addPropertyAction,
          editPropertiesAction
        ]
      }
    }
      
    var startInEditMode = $scope.factoryPid && !$routeParams['pid'];
    $scope.editMode = startInEditMode;

    $scope.$on("hawtio.form.modelChange", () => {
      if ($scope.modelLoaded) {
        // TODO lets check if we've really changed the values!
        enableCanSave();
        Core.$apply($scope);
      }
    });

    function updatePid(mbean, pid, data) {
      var completeFn = (response) => {
        Core.notification("success", "Successfully updated pid: " + pid);

        if (pid && $scope.factoryPid && $scope.newPid) {
          // we've just created a new pid so lets move to the full pid URL
          var newPath = createConfigPidPath($scope, pid);
          $location.path(newPath);
        } else {
          $scope.editMode = false;
          $scope.canSave = false;
          $scope.saved = true;
        }
      };
      var callback = Core.onSuccess(completeFn, errorHandler("Failed to update: " + pid));
      var json = JSON.stringify(data);
      jolokia.execute(mbean, "configAdminUpdate", pid, json, callback);
    }

    $scope.pidSave = () => {
      var data = {};

      angular.forEach($scope.entity, (value, key) => {
        var text = undefined;
        if (angular.isString(value)) {
          text = value;
        } else if (angular.isDefined(value)) {
          text = value.toString();
        }
        if (angular.isDefined(text)) {
          data[decodeKey(key, $scope.pid)] = text;
        }
      });

      //log.info("about to update value " + angular.toJson(data));

      var mbean = getHawtioConfigAdminMBean(workspace);
      if (mbean || $scope.inFabricProfile) {
        var pidMBean = getSelectionConfigAdminMBean(workspace);
        var pid = $scope.pid;
        var zkPid = $scope.zkPid;
        var factoryPid = $scope.factoryPid;
        if (!$scope.inFabricProfile && factoryPid && pidMBean && !zkPid) {
          // lets generate a new pid
          jolokia.execute(pidMBean, "createFactoryConfiguration", factoryPid, Core.onSuccess((response) => {
            pid = response;
            if (pid) {
              updatePid(mbean, pid, data);
            }
          }, errorHandler("Failed to create new PID: ")));
        } else {
          if ($scope.newPid) {
            var pidInstanceName = $scope.createForm.pidInstanceName;
            if (!pidInstanceName || !factoryPid) {
              return;
            }
            pid = factoryPid + "-" + pidInstanceName;
          } else if (zkPid) {
            pid = zkPid;
          }
          updatePid(mbean, pid, data);
        }
      }

      $scope.editMode = false;
    };

    $scope.cancelSave = function() {
      updateSchema();
      $scope.editMode = false;
    }

    function errorHandler(message) {
       return {
         error: (response) => {
           Core.notification("error", message + "\n" + response['error'] || response);
           Core.defaultJolokiaErrorHandler(response);
         }
       }
    }

    function enableCanSave() {
      if ($scope.editMode) {
        $scope.canSave = true;
      }
    }

    $scope.openAddPropertyDialog = () => {
      uibModalInstance = $uibModal.open({
        templateUrl: 'addPropertyDialog.html',
        scope: $scope
      });      
    }

    $scope.addPropertyConfirmed = (key, value) => {
      uibModalInstance.close();
      $scope.configValues[key] = {
        Key: key,
        Value: value,
        Type: "String"
      };
      updateSchema();
      $scope.pidSave();
    };

    $scope.deletePidProp = (e) => {
      $scope.deleteKey = e.Key;
      uibModalInstance = $uibModal.open({
        templateUrl: 'deletePropDialog.html',
        scope: $scope
      });      
    };

    $scope.deletePidPropConfirmed = () => {
      uibModalInstance.close();
      var cell:any = document.getElementById("pid." + $scope.deleteKey);
      cell.parentElement.remove();
      enableCanSave();
    };

    $scope.goToConfigurationsPage = () => $location.path('/osgi/configurations');

    function populateTable(response) {
      $scope.modelLoaded = true;
      var configValues = response || {};
      $scope.configValues = configValues;
      $scope.zkPid = Core.pathGet(configValues, ["fabric.zookeeper.pid", "Value"]);

      if ($scope.zkPid && $scope.saved) {
        // lets load the current properties direct from git
        // in case we have just saved them into git and config admin hasn't yet
        // quite caught up yet (to avoid freaking the user out that things look like
        // changes got reverted ;)
        function onProfileProperties(gitProperties) {
          angular.forEach(gitProperties, (value, key) => {
            var configProperty = configValues[key];
            if (configProperty) {
              configProperty.Value = value;
            }
          });
          updateSchemaAndLoadMetaType();
          Core.$apply($scope);
        }
      } else {
        updateSchemaAndLoadMetaType();
      }
    }

    function updateSchemaAndLoadMetaType() {
      updateSchema();
      var configValues = $scope.configValues;
      if (configValues) {
        if ($scope.profileNotRunning && $scope.profileMetadataMBean && $scope.versionId && $scope.profileId) {
          var pid = $scope.factoryPid || $scope.pid;
          jolokia.execute($scope.profileMetadataMBean, "getPidMetaTypeObject", $scope.versionId, $scope.profileId, pid, Core.onSuccess(onMetaType));
        } else {
          var locale = null;
          var pid = null;
          var factoryId = configValues["service.factoryPid"];
          if (factoryId && !pid) {
            pid = factoryId["Value"];
          }

          var metaTypeMBean = getMetaTypeMBean(workspace);
          if (metaTypeMBean) {
            jolokia.execute(metaTypeMBean, "getPidMetaTypeObject", pid, locale, Core.onSuccess(onMetaType));
          }
        }
      }
      Core.$apply($scope);
    }

    function onMetaType(response) {
      $scope.metaType = response;
      updateSchema();
      Core.$apply($scope);
    }

    /**
     * Updates the JSON schema model
     */
    function updateSchema() {
      var properties = {};
      var required = [];
      $scope.defaultValues = {

      };
      var schema = {
        type: "object",
        required: required,
        properties: properties
      };
      var inputClass = "form-control";
      var labelClass = "col-sm-2 control-label";

      //var inputClassArray = "span11";
      var inputClassArray = "";
      var labelClassArray = labelClass;

      var metaType = $scope.metaType;
      if (metaType) {
        var pidMetadata = Osgi.configuration.pidMetadata;
        var pid = metaType.id;
        schema["id"] = pid;
        schema["name"] = Core.pathGet(pidMetadata, [pid, "name"]) || metaType.name;
        schema["description"] = Core.pathGet(pidMetadata, [pid, "description"]) || metaType.description;

        var disableHumanizeLabel = Core.pathGet(pidMetadata, [pid, "schemaExtensions", "disableHumanizeLabel"]);

        angular.forEach(metaType.attributes, (attribute) => {
          var id = attribute.id;
          if (isValidProperty(id)) {
            var key = encodeKey(id, pid);
            var typeName = asJsonSchemaType(attribute.typeName, attribute.id);
            var attributeProperties = {
              title: attribute.name,
              tooltip: attribute.description,
              'input-attributes': {
                class: inputClass
              },
              'label-attributes': {
                class: labelClass
              },
              type: typeName

            };
            if (disableHumanizeLabel) {
              attributeProperties.title = id;
            }
            if (attribute.typeName === "char") {
              attributeProperties["maxLength"] = 1;
              attributeProperties["minLength"] = 1;
            }
            var cardinality = attribute.cardinality;
            if (cardinality) {
              // lets clear the span on arrays to fix layout issues
              attributeProperties['input-attributes']['class'] = null;
              attributeProperties.type = "array";
              attributeProperties["items"] = {
                'input-attributes': {
                  class: inputClassArray
                },
                'label-attributes': {
                  class: labelClassArray
                },
                "type": typeName
              };
            }
            if (attribute.required) {
              required.push(id);
            }
            var defaultValue = attribute.defaultValue;
            if (defaultValue) {
              if (angular.isArray(defaultValue) && defaultValue.length === 1) {
                defaultValue = defaultValue[0];
              }
              //attributeProperties["default"] = defaultValue;
              // TODO convert to boolean / number?
              $scope.defaultValues[key] = defaultValue;
            }
            var optionLabels = attribute.optionLabels;
            var optionValues = attribute.optionValues;
            if (optionLabels && optionLabels.length && optionValues && optionValues.length) {
              var enumObject = {};
              for (var i = 0; i < optionLabels.length; i++) {
                var label = optionLabels[i];
                var value = optionValues[i];
                enumObject[value] = label;
              }
              $scope.selectValues[key] = enumObject;
              Core.pathSet(attributeProperties, ['input-element'], "select");
              Core.pathSet(attributeProperties, ['input-attributes', "ng-options"], "key as value for (key, value) in selectValues." + key);
            }
            properties[key] = attributeProperties;
          }
        });

        // now lets override anything from the custom metadata
        var schemaExtensions = Core.pathGet(Osgi.configuration.pidMetadata, [pid, "schemaExtensions"]);
        if (schemaExtensions) {
          // now lets copy over the schema extensions
          overlayProperties(schema, schemaExtensions);
        }
      }

      // now add all the missing properties...
      var entity = {};
      angular.forEach($scope.configValues, (value, rawKey) => {
        if (isValidProperty(rawKey)) {
          var key = encodeKey(rawKey, pid);
          var attrValue = value;
          var attrType = "string";
          if (angular.isObject(value)) {
            attrValue = value.Value;
            attrType = asJsonSchemaType(value.Type, rawKey);
          }
          var property = properties[key];
          if (!property) {
            property = {
              'input-attributes': {
                class: inputClass
              },
              'label-attributes': {
                class: labelClass
              },
              type: attrType
            };
            properties[key] = property;
            if (rawKey == 'org.osgi.service.http.port') {
              properties[key]['input-attributes']['disabled'] = 'disabled';
              properties[key]['input-attributes']['title'] = 'Changing port of OSGi http service is not possible from Hawtio';
            }
          } else {
            var propertyType = property["type"];
            if ("array" === propertyType) {
              if (!angular.isArray(attrValue)) {
                attrValue = attrValue ? attrValue.split(",") : [];
              }
            }
          }
          if (disableHumanizeLabel) {
            property.title = rawKey;
          }

          //comply with Forms.safeIdentifier in 'forms/js/formHelpers.ts'
          key = key.replace(/-/g, "_");
          entity[key] = attrValue;
        }
      });

      // add default values for missing values
      angular.forEach($scope.defaultValues, (value, key) => {
        var current = entity[key];
        if (!angular.isDefined(current)) {
          //log.info("updating entity " + key + " with default: " + value + " as was: " + current);
          entity[key] = value;
        }
      });

      editPropertiesAction.isDisabled = Object.keys(entity).length === 0;
      
      //log.info("default values: " + angular.toJson($scope.defaultValues));
      $scope.entity = entity;
      $scope.schema = schema;
      $scope.fullSchema = schema;
    }

    /**
     * Recursively overlays the properties in the overlay into the object; so any atttributes are added into the object
     * and any nested objects in the overlay are inserted into the object at the correct path.
     */
    function overlayProperties(object, overlay) {
      if (angular.isObject(object)) {
        if (angular.isObject(overlay)) {
          angular.forEach(overlay, (value, key) => {
            if (angular.isObject(value)) {
              var child = object[key];
              if (!child) {
                child = {};
                object[key] = child;
              }
              overlayProperties(child, value);
            } else {
              object[key] = value;
            }
          });
        }
      }
    }

    var ignorePropertyIds = ["service.pid", "service.factoryPid", "fabric.zookeeper.pid"];

    function isValidProperty(id) {
      return id && ignorePropertyIds.indexOf(id) < 0;
    }

    function encodeKey(key, pid) {
        return key.replace(/\./g, "__");
    }

    function decodeKey(key, pid) {
        return key.replace(/__/g, ".");
    }

    function asJsonSchemaType(typeName, id) {
      if (typeName) {
        var lower = typeName.toLowerCase();
        if (_.startsWith(lower, "int") || lower === "long" || lower === "short" || lower === "byte" || _.endsWith(lower, "int")) {
          return "integer";
        }
        if (lower === "double" || lower === "float" || lower === "bigdecimal") {
          return "number";
        }
        if (lower === "string") {
          // TODO hack to try force password type on dodgy metadata such as pax web
          if (id && _.endsWith(id, "password")) {
            return "password";
          }
          return "string";
        }
        return typeName;
      } else {
        return "string";
      }
    }

    function onProfilePropertiesLoaded(response) {
      $scope.modelLoaded = true;
      var configValues = {};
      $scope.configValues = configValues;
      angular.forEach(response, (value, oKey) => {
        // lets remove any dodgy characters
        var key = oKey.replace(/:/g, '_').replace(/\//g, '_');
        configValues[key] = {
          Key: key,
          Value: value
        };
      });
      $scope.zkPid = Core.pathGet(configValues, ["fabric.zookeeper.pid", "Value"]);
      updateSchemaAndLoadMetaType();
      Core.$apply($scope);
    }

    function updateTableContents() {
      $scope.modelLoaded = false;
      Osgi.getConfigurationProperties(workspace, jolokia, $scope.pid, populateTable);
    }

    // load initial data
    updateTableContents();

  }]);
}
