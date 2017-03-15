/// <reference path="../camelPlugin.ts"/>
/// <reference path="property.ts"/>

module Camel {

  export class PropertiesService {
    
    getDefinedProperties(schema: {}): Property[] {
      return Object.keys(schema['properties'])
        .filter(key => 'value' in schema['properties'][key])
        .map(key => {
          let propertySchema = schema['properties'][key];
          console.log(propertySchema);
          let name = propertySchema['title'] || key;
          return new Property(name, propertySchema['value'], propertySchema['description']);
        })
        .sort(Property.sortByName);
    }

    getDefaultProperties(schema: {}): Property[] {
      return Object.keys(schema['properties'])
        .filter(key => !('value' in schema['properties'][key]))
        .filter(key => 'defaultValue' in schema['properties'][key])
        .map(key => {
          let propertySchema = schema['properties'][key];
          let name = propertySchema['title'] || key;
          return new Property(name, propertySchema['defaultValue'], propertySchema['description']);
        })
        .sort(Property.sortByName);
    }

    getUndefinedProperties(schema: {}): Property[] {
      return Object.keys(schema['properties'])
        .filter(key => !('value' in schema['properties'][key]))
        .filter(key => !('defaultValue' in schema['properties'][key]))
        .map(key => {
          let propertySchema = schema['properties'][key];
          let name = propertySchema['title'] || key;
          return new Property(name, null, propertySchema['description']);
        })
        .sort(Property.sortByName);
    }
  }

  _module.service('propertiesService', PropertiesService);

}
