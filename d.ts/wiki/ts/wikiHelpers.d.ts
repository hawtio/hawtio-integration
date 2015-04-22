/// <reference path="../../includes.d.ts" />
/// <reference path="../../git/ts/gitHelpers.d.ts" />
/**
 * @module Wiki
 */
declare module Wiki {
    var log: Logging.Logger;
    var camelNamespaces: string[];
    var springNamespaces: string[];
    var droolsNamespaces: string[];
    var dozerNamespaces: string[];
    var activemqNamespaces: string[];
    var excludeAdjustmentPrefixes: string[];
    enum ViewMode {
        List = 0,
        Icon = 1,
    }
    /**
     * The custom views within the wiki namespace; either "/wiki/$foo" or "/wiki/branch/$branch/$foo"
     */
    var customWikiViewPages: string[];
    /**
     * Which extensions do we wish to hide in the wiki file listing
     * @property hideExtensions
     * @for Wiki
     * @type Array
     */
    var hideExtensions: string[];
    interface GenerateOptions {
        workspace: Core.Workspace;
        form: any;
        name: string;
        branch: string;
        parentId: string;
        success: (fileContents?: string) => void;
        error: (error: any) => void;
    }
    /**
     * The wizard tree for creating new content in the wiki
     * @property documentTemplates
     * @for Wiki
     * @type Array
     */
    var documentTemplates: ({
        label: string;
        tooltip: string;
        folder: boolean;
        icon: string;
        exemplar: string;
        regex: RegExp;
        invalid: string;
    } | {
        label: string;
        tooltip: string;
        profile: boolean;
        addClass: string;
        exemplar: string;
        regex: RegExp;
        invalid: string;
        fabricOnly: boolean;
    } | {
        label: string;
        tooltip: string;
        exemplar: string;
        regex: RegExp;
        invalid: string;
        extension: string;
    } | {
        label: string;
        tooltip: string;
        children: {
            label: string;
            tooltip: string;
            icon: string;
            exemplar: string;
            regex: RegExp;
            invalid: string;
            extension: string;
        }[];
    })[];
    function isFMCContainer(workspace: any): boolean;
    function isWikiEnabled(workspace: Workspace, jolokia: any, localStorage: any): boolean;
    function goToLink(link: any, $timeout: any, $location: any): void;
    /**
     * Returns all the links for the given branch for the custom views, starting with "/"
     * @param $scope
     * @returns {string[]}
     */
    function customViewLinks($scope: any): string[];
    /**
     * Returns a new create document wizard tree
     * @method createWizardTree
     * @for Wiki
     * @static
     */
    function createWizardTree(workspace: Workspace, $scope: any): Folder;
    function addCreateWizardFolders(workspace: Workspace, $scope: any, parent: Folder, templates: any[]): void;
    function startLink(branch: string): string;
    /**
     * Returns true if the given filename/path is an index page (named index.* and is a markdown/html page).
     *
     * @param path
     * @returns {boolean}
     */
    function isIndexPage(path: string): boolean;
    function viewLink(branch: string, pageId: string, $location: any, fileName?: string): string;
    function branchLink(branch: string, pageId: string, $location: any, fileName?: string): string;
    function editLink(branch: string, pageId: string, $location: any): string;
    function createLink(branch: string, pageId: string, $location: any, $scope: any): string;
    function encodePath(pageId: string): string;
    function decodePath(pageId: string): string;
    function fileFormat(name: string, fileExtensionTypeRegistry?: any): any;
    /**
     * Returns the file name of the given path; stripping off any directories
     * @method fileName
     * @for Wiki
     * @static
     * @param {String} path
     * @return {String}
     */
    function fileName(path: string): string;
    /**
     * Returns the folder of the given path (everything but the last path name)
     * @method fileParent
     * @for Wiki
     * @static
     * @param {String} path
     * @return {String}
     */
    function fileParent(path: string): string;
    /**
     * Returns the file name for the given name; we hide some extensions
     * @method hideFineNameExtensions
     * @for Wiki
     * @static
     * @param {String} name
     * @return {String}
     */
    function hideFileNameExtensions(name: any): any;
    /**
     * Returns the URL to perform a GET or POST for the given branch name and path
     */
    function gitRestURL(branch: string, path: string): string;
    /**
   * Returns a relative URL to perform a GET or POST for the given branch/path
   */
    function gitRelativeURL(branch: string, path: string): string;
    /**
     * Takes a row containing the entity object; or can take the entity directly.
     *
     * It then uses the name, directory and xmlNamespaces properties
     *
     * @method fileIconHtml
     * @for Wiki
     * @static
     * @param {any} row
     * @return {String}
     *
     */
    function fileIconHtml(row: any): string;
    function iconClass(row: any): string;
    /**
     * Extracts the pageId, branch, objectId from the route parameters
     * @method initScope
     * @for Wiki
     * @static
     * @param {*} $scope
     * @param {any} $routeParams
     * @param {ng.ILocationService} $location
     */
    function initScope($scope: any, $routeParams: any, $location: any): void;
    /**
     * Loads the branches for this wiki repository and stores them in the branches property in
     * the $scope and ensures $scope.branch is set to a valid value
     *
     * @param wikiRepository
     * @param $scope
     * @param isFmc whether we run as fabric8 or as hawtio
     */
    function loadBranches(jolokia: any, wikiRepository: any, $scope: any, isFmc?: boolean): void;
    /**
     * Extracts the pageId from the route parameters
     * @method pageId
     * @for Wiki
     * @static
     * @param {any} $routeParams
     * @param @ng.ILocationService @location
     * @return {String}
     */
    function pageId($routeParams: any, $location: any): any;
    function pageIdFromURI(url: string): string;
    function fileExtension(name: any): string;
    function onComplete(status: any): void;
    /**
     * Parses the given JSON text reporting to the user if there is a parse error
     * @method parseJson
     * @for Wiki
     * @static
     * @param {String} text
     * @return {any}
     */
    function parseJson(text: string): any;
    /**
     * Adjusts a relative or absolute link from a wiki or file system to one using the hash bang syntax
     * @method adjustHref
     * @for Wiki
     * @static
     * @param {*} $scope
     * @param {ng.ILocationService} $location
     * @param {String} href
     * @param {String} fileExtension
     * @return {string}
     */
    function adjustHref($scope: any, $location: any, href: any, fileExtension: any): string;
}
