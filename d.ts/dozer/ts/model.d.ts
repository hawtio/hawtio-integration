/// <reference path="../../includes.d.ts" />
/**
 * @module Dozer
 */
declare module Dozer {
    /**
     * @class Mappings
     */
    class Mappings {
        doc: any;
        mappings: Mapping[];
        constructor(doc: any, mappings?: Mapping[]);
    }
    /**
     * @class Mapping
     */
    class Mapping {
        map_id: string;
        class_a: MappingClass;
        class_b: MappingClass;
        fields: Field[];
        constructor();
        name(): string;
        hasFromField(name: string): Field;
        hasToField(name: string): Field;
        saveToElement(element: any): void;
    }
    /**
     * @class MappingClass
     */
    class MappingClass {
        value: string;
        constructor(value: string);
        saveToElement(element: any): void;
    }
    /**
     * @class Field
     */
    class Field {
        a: FieldDefinition;
        b: FieldDefinition;
        constructor(a: FieldDefinition, b: FieldDefinition);
        name(): string;
        saveToElement(element: any): void;
    }
    /**
     * @class FieldDefinition
     */
    class FieldDefinition {
        value: string;
        constructor(value: string);
        saveToElement(element: any): void;
    }
    /**
     * @class UnmappedField
     */
    class UnmappedField {
        fromField: string;
        property: any;
        toField: string;
        constructor(fromField: string, property: any, toField?: string);
    }
}
