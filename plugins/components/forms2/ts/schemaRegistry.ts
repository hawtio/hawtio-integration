/// <reference path="forms2Plugin.ts"/>
namespace HawtioForms {
  _module.factory("SchemaRegistry", ['ControlMappingRegistry', (mappings) => {
    var schemaMap = {};
    var listeners = {};
    function addSchemaInternal(name: string, schema: any):void {
      schemaMap[name] = schema;
      _.forIn(listeners, (listener: Function, id) => {
        listener(name, schema);
      });
    }
    function getTypeConfig(type:string):any {
      if (mappings.getMapping(type) === type) {
        return {
          type: 'object',
          javaType: type
        };
      } else {
        return {
          type: type
        };
      }
    } 
    var registry = <SchemaRegistry> {
      addListener: (name: string, callback: (name: string, schema: any) => void) => {
        if (!name || !callback) {
          return;
        }
        _.forIn(schemaMap, (schema, name) => {
          callback(name, schema);
        });
        listeners[name] = callback;
      },
      removeListener: (name: string) => {
        if (name in listeners) {
          delete listeners[name];
        }
      },
      addSchema: (name: string, schema: any):void => {
        var schemaClone = _.cloneDeep(schema);
        _.forIn(schemaClone.properties, (property, id) => {
          if (_.startsWith(property.javaType, 'java.util.Map')) {
            var trimmed = property.javaType.replace('java.util.Map<', '').replace('>', '');
            var parts = trimmed.split(',');
            if (parts.length !== 2) {
              return;
            }
            property.type = 'map';
            property.items = {
              key: getTypeConfig(parts[0]),
              value: getTypeConfig(parts[1])
            }
          }
        });
        // log.debug("Adding schema: ", name, " schema: ", schema);
        addSchemaInternal(name, schemaClone);
        if (schema.javaType) {
          // log.debug("Adding schema by Java type: ", schema.javaType, " value: ", schema);
          addSchemaInternal(schema.javaType, schemaClone);
        }
        if (schema.definitions) {
          // log.debug("Found definitions in schema: ", name);
          _.forIn(schema.definitions, (value, key) => {
            registry.addSchema(key, value);
          });
          }
      },
      getSchema: (name: string):any => {
        return schemaMap[name];
      },
      cloneSchema: (name: string):FormConfiguration => {
        return _.cloneDeep(schemaMap[name]);
      },
      removeSchema: (name:string):any => {
        var answer = <any> undefined;
        if (name in schemaMap) {
          answer = schemaMap[name];
          delete schemaMap[name];
        }
        return answer;
      },
      iterate: (iter:(FormConfiguration, string) => void) => {
        _.forIn(schemaMap, iter);
      }
    };
    /*
    registry.addListener('logging', (name: string, schema: any) => {
      log.debug("Added schema name: ", name, " schema: ", schema);
    });
    */
    return registry;
  }]);
}
