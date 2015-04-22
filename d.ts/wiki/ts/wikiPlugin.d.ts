/// <reference path="../../includes.d.ts" />
/// <reference path="../../git/ts/gitHelpers.d.ts" />
/// <reference path="wikiHelpers.d.ts" />
/**
 * @module Wiki
 * @main Wiki
 */
declare module Wiki {
    var pluginName: string;
    var templatePath: string;
    var tab: any;
    var _module: ng.IModule;
    var controller: (name: string, inlineAnnotatedConstructor: any[]) => ng.IModule;
    var route: (templateName: string, reloadOnSearch?: boolean) => {
        templateUrl: string;
        reloadOnSearch: boolean;
    };
    /**
     * Branch Menu service
     */
    interface BranchMenu {
        addExtension: (item: UI.MenuItem) => void;
        applyMenuExtensions: (menu: UI.MenuItem[]) => void;
    }
}
