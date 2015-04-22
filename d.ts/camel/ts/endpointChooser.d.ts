/// <reference path="../../includes.d.ts" />
/**
 * @module Camel
 */
declare module Camel {
    /**
     * Define the default categories for endpoints and map them to endpoint names
     * @property
     * @for Camel
     * @type {ObjecT}
     */
    var endpointCategories: {
        bigdata: {
            label: string;
            endpoints: string[];
            endpointIcon: string;
        };
        database: {
            label: string;
            endpoints: string[];
            endpointIcon: string;
        };
        cloud: {
            label: string;
            endpoints: string[];
        };
        core: {
            label: string;
            endpoints: string[];
        };
        messaging: {
            label: string;
            endpoints: string[];
            endpointIcon: string;
        };
        mobile: {
            label: string;
            endpoints: string[];
        };
        sass: {
            label: string;
            endpoints: string[];
        };
        social: {
            label: string;
            endpoints: string[];
        };
        storage: {
            label: string;
            endpointIcon: string;
            endpoints: string[];
        };
        template: {
            label: string;
            endpoints: string[];
        };
    };
    /**
     * Maps endpoint names to a category object
     * @property
     * @for Camel
     * @type {ObjecT}
     */
    var endpointToCategory: {};
    var endpointIcon: string;
    /**
     *  specify custom label & icon properties for endpoint names
     * @property
     * @for Camel
     * @type {ObjecT}
     */
    var endpointConfigurations: {
        drools: {
            icon: string;
        };
        quartz: {
            icon: string;
        };
        facebook: {
            icon: string;
        };
        salesforce: {
            icon: string;
        };
        sap: {
            icon: string;
        };
        "sap-netweaver": {
            icon: string;
        };
        timer: {
            icon: string;
        };
        twitter: {
            icon: string;
        };
        weather: {
            icon: string;
        };
    };
    /**
     * Define the default form configurations
     * @property
     * @for Camel
     * @type {ObjecT}
     */
    var endpointForms: {
        file: {
            tabs: {
                'Options': string[];
            };
        };
        activemq: {
            tabs: {
                'Connection': string[];
                'Producer': string[];
                'Consumer': string[];
                'Reply': string[];
                'Options': string[];
            };
        };
    };
    function getEndpointIcon(endpointName: any): any;
    function getEndpointConfig(endpointName: any, category: any): any;
    function getEndpointCategory(endpointName: string): any;
    function getConfiguredCamelModel(): any;
    function initEndpointChooserScope($scope: any, $location: any, localStorage: WindowLocalStorage, workspace: Workspace, jolokia: any): void;
}
