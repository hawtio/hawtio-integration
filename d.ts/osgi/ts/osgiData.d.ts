/// <reference path="../../includes.d.ts" />
/// <reference path="osgiHelpers.d.ts" />
/// <reference path="osgiPlugin.d.ts" />
/**
 * @module Osgi
 */
declare module Osgi {
    class OsgiDataService {
        private jolokia;
        private workspace;
        constructor(workspace: Workspace, jolokia: any);
        getBundles(): {};
        getServices(): {};
        getPackages(): {};
    }
}
