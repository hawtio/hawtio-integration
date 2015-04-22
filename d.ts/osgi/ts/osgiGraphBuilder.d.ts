/// <reference path="../../includes.d.ts" />
/// <reference path="osgiHelpers.d.ts" />
/// <reference path="osgiPlugin.d.ts" />
/**
 * @module Osgi
 */
declare module Osgi {
    class OsgiGraphBuilder {
        private osgiDataService;
        private bundleFilter;
        private packageFilter;
        private showServices;
        private showPackages;
        private hideUnused;
        private graphBuilder;
        private filteredBundles;
        private bundles;
        private services;
        private packages;
        private PREFIX_BUNDLE;
        private PREFIX_SVC;
        private PREFIX_PKG;
        constructor(osgiDataService: OsgiDataService, bundleFilter: String, packageFilter: String, showServices: boolean, showPackages: boolean, hideUnused: boolean);
        getBundles(): any;
        getServices(): any;
        getPackages(): any;
        bundleNodeId(bundle: any): string;
        serviceNodeId(service: any): string;
        pkgNodeId(pkg: any): string;
        buildSvcNode(service: any): {
            id: string;
            name: string;
            type: string;
            used: boolean;
            popup: {
                title: string;
                content: () => string;
            };
        };
        buildBundleNode(bundle: any): {
            id: string;
            name: any;
            type: string;
            used: boolean;
            navUrl: string;
            popup: {
                title: string;
                content: string;
            };
        };
        buildPackageNode(pkg: any): {
            id: string;
            name: any;
            type: string;
            used: boolean;
            popup: {
                title: string;
                content: string;
            };
        };
        exportingBundle(pkg: any): any;
        addFilteredBundles(): void;
        addFilteredServices(): void;
        addFilteredPackages(): void;
        buildGraph(): {
            nodes: any[];
            links: any[];
            linktypes: any;
        };
    }
}
