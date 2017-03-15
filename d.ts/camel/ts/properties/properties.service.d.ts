/// <reference path="../camelPlugin.d.ts" />
/// <reference path="property.d.ts" />
declare module Camel {
    class PropertiesService {
        getDefinedProperties(schema: {}): Property[];
        getDefaultProperties(schema: {}): Property[];
        getUndefinedProperties(schema: {}): Property[];
    }
}
