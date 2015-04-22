/// <reference path="../../includes.d.ts" />
/**
 * @module Dozer
 * @main Dozer
 */
declare module Dozer {
    var io_hawt_dozer_schema_Field: any;
    var io_hawt_dozer_schema_FieldExclude: any;
    var io_hawt_dozer_schema_Mapping: any;
    var io_hawt_dozer_schema_Mappings: any;
    /**
     * The JMX domain for Dozer
     * @property jmxDomain
     * @for Dozer
     * @type String
     */
    var jmxDomain: string;
    var introspectorMBean: string;
    /**
     * Don't try and load properties for these types
     * @property excludedPackages
     * @for Dozer
     * @type {Array}
     */
    var excludedPackages: string[];
    /**
     * Lets map the class names to element names
     * @property elementNameMappings
     * @for Dozer
     * @type {Array}
     */
    var elementNameMappings: {
        "Mapping": string;
        "MappingClass": string;
        "Field": string;
    };
    var log: Logging.Logger;
    /**
     * Converts the XML string or DOM node to a Dozer model
     * @method loadDozerModel
     * @for Dozer
     * @static
     * @param {Object} xml
     * @param {String} pageId
     * @return {Mappings}
     */
    function loadDozerModel(xml: any, pageId: string): Mappings;
    function saveToXmlText(model: Mappings): string;
    function findUnmappedFields(workspace: Workspace, mapping: Mapping, fn: any): void;
    /**
     * Finds the properties on the given class and returns them; and either invokes the given function
     * or does a sync request and returns them
     * @method findProperties
     * @for Dozer
     * @static
     * @param {Core.Workspace} workspace
     * @param {String} className
     * @param {String} filter
     * @param {Function} fn
     * @return {any}
     */
    function findProperties(workspace: Workspace, className: string, filter?: string, fn?: any): any;
    /**
     * Finds class names matching the given search text and either invokes the function with the results
     * or does a sync request and returns them.
     * @method findClassNames
     * @for Dozer
     * @static
     * @param {Core.Workspace} workspace
     * @param {String} searchText
     * @param {Number} limit @default 20
     * @param {Function} fn
     * @return {any}
     */
    function findClassNames(workspace: Workspace, searchText: string, limit?: number, fn?: any): any;
    function getIntrospectorMBean(workspace: Workspace): string;
    function loadModelFromTree(rootTreeNode: any, oldModel: Mappings): Mappings;
    function createDozerTree(model: Mappings): Folder;
    function createMappingFolder(mapping: any, parentFolder: any): Folder;
    function addMappingFieldFolder(field: any, mappingFolder: any): Folder;
    function appendAttributes(object: any, element: any, ignorePropertyNames: string[]): void;
    /**
     * Adds a new child element for this mapping to the given element
     * @method appendElement
     * @for Dozer
     * @static
     * @param {any} object
     * @param {any} element
     * @param {String} elementName
     * @param {Number} indentLevel
     * @return the last child element created
     */
    function appendElement(object: any, element: any, elementName?: string, indentLevel?: number): any;
    function nameOf(object: any): any;
    function addTextNode(element: any, text: string): void;
}
