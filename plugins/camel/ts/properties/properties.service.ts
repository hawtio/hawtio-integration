/// <reference path="../camelPlugin.ts"/>
/// <reference path="property.ts"/>

namespace Camel {

  export class PropertiesService {
    
    getDefinedProperties(schemaProperties: {}): Property[] {
      return Object.keys(schemaProperties)
        .filter(key => schemaProperties[key]['value'])
        .map(key => {
          let propertySchema = schemaProperties[key];
          let name = propertySchema['title'] || key;
          return new Property(name, propertySchema['value'], propertySchema['description']);
        })
        .sort(Property.sortByName);
    }

    getDefaultProperties(schemaProperties: {}): Property[] {
      return Object.keys(schemaProperties)
        .filter(key => !schemaProperties[key]['value'])
        .filter(key => 'defaultValue' in schemaProperties[key])
        .map(key => {
          let propertySchema = schemaProperties[key];
          let name = propertySchema['title'] || key;
          return new Property(name, propertySchema['defaultValue'], propertySchema['description']);
        })
        .sort(Property.sortByName);
    }

    getUndefinedProperties(schemaProperties: {}): Property[] {
      return Object.keys(schemaProperties)
        .filter(key => !schemaProperties[key]['value'])
        .filter(key => !('defaultValue' in schemaProperties[key]))
        .map(key => {
          let propertySchema = schemaProperties[key];
          let name = propertySchema['title'] || key;
          return new Property(name, null, propertySchema['description']);
        })
        .sort(Property.sortByName);
    }
  }

  _module.service('propertiesService', PropertiesService);

}
