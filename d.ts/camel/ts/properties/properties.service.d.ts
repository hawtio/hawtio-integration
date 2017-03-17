/// <reference path="../camelPlugin.d.ts" />
/// <reference path="property.d.ts" />
declare module Camel {
    class PropertiesService {
        getDefinedProperties(schemaProperties: {}): Property[];
        getDefaultProperties(schemaProperties: {}): Property[];
        getUndefinedProperties(schemaProperties: {}): Property[];
    }
}
