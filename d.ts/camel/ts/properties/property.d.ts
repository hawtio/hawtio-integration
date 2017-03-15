declare module Camel {
    class Property {
        name: string;
        value: string;
        description: string;
        constructor(name: string, value: string, description: string);
        static sortByName(a: any, b: any): number;
    }
}
