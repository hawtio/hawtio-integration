/// <reference path="../../includes.d.ts" />
/// <reference path="dockerRegistryHelpers.d.ts" />
declare module DockerRegistry {
    var _module: ng.IModule;
    var controller: (name: string, inlineAnnotatedConstructor: any[]) => ng.IModule;
    var route: (templateName: string, reloadOnSearch?: boolean) => {
        templateUrl: string;
        reloadOnSearch: boolean;
    };
}
