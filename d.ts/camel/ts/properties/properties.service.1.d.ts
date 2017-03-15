/// <reference path="../camelPlugin.d.ts" />
declare module Camel {
    class Property {
        name: string;
        value: string;
        description: string;
        constructor(name: string, value: string, description: string);
        static sortByName(a: any, b: any): number;
    }
    class PropertiesService {
        constructor();
        getDefinedProperties(data: {}, schema: {}): Property[];
        getDefaultProperties(data: {}, schema: {}): Property[];
        getUndefinedProperties(data: {}, schema: {}): Property[];
    }
}
