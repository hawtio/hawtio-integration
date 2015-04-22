/// <reference path="../../includes.d.ts" />
/// <reference path="../../git/ts/gitHelpers.d.ts" />
/// <reference path="wikiHelpers.d.ts" />
/// <reference path="wikiPlugin.d.ts" />
/**
 * @module Wiki
 */
declare module Wiki {
    /**
     * @class WikiRepository
     */
    interface WikiRepository {
        getRepositoryLabel(fn: any, error: any): any;
        putPage(branch: string, path: string, contents: string, commitMessage: string, fn: any): void;
        putPageBase64(branch: string, path: string, contents: string, commitMessage: string, fn: any): void;
        removePage(branch: string, path: string, commitMessage: string, fn: any): void;
    }
    /**
     * @class GitWikiRepository
     */
    class GitWikiRepository implements WikiRepository {
        factoryMethod: () => Git.GitRepository;
        directoryPrefix: string;
        constructor(factoryMethod: () => Git.GitRepository);
        getRepositoryLabel(fn: any, error: any): void;
        exists(branch: string, path: string, fn: any): Boolean;
        completePath(branch: string, completionText: string, directoriesOnly: boolean, fn: any): any;
        getPage(branch: string, path: string, objectId: string, fn: any): Git.GitRepository;
        /**
         * Performs a diff on the versions
         * @method diff
         * @for GitWikiRepository
         * @param {String} objectId
         * @param {String} baseObjectId
         * @param {String} path
         * @param {Function} fn
         * @return {any}
         */
        diff(objectId: string, baseObjectId: string, path: string, fn: any): Git.GitRepository;
        commitInfo(commitId: string, fn: any): void;
        commitTree(commitId: string, fn: any): void;
        putPage(branch: string, path: string, contents: string, commitMessage: string, fn: any): void;
        putPageBase64(branch: string, path: string, contents: string, commitMessage: string, fn: any): void;
        createDirectory(branch: string, path: string, commitMessage: string, fn: any): void;
        revertTo(branch: string, objectId: string, blobPath: string, commitMessage: string, fn: any): void;
        rename(branch: string, oldPath: string, newPath: string, commitMessage: string, fn: any): void;
        removePage(branch: string, path: string, commitMessage: string, fn: any): void;
        /**
         * Returns the full path to use in the git repo
         * @method getPath
         * @for GitWikiRepository
         * @param {String} path
         * @return {String{
         */
        getPath(path: string): string;
        getLogPath(path: string): string;
        /**
         * Return the history of the repository or a specific directory or file path
         * @method history
         * @for GitWikiRepository
         * @param {String} branch
         * @param {String} objectId
         * @param {String} path
         * @param {Number} limit
         * @param {Function} fn
         * @return {any}
         */
        history(branch: string, objectId: string, path: string, limit: number, fn: any): Git.GitRepository;
        /**
         * Get the contents of a blobPath for a given commit objectId
         * @method getContent
         * @for GitWikiRepository
         * @param {String} objectId
         * @param {String} blobPath
         * @param {Function} fn
         * @return {any}
         */
        getContent(objectId: string, blobPath: string, fn: any): Git.GitRepository;
        /**
         * Get the list of branches
         * @method branches
         * @for GitWikiRepository
         * @param {Function} fn
         * @return {any}
         */
        branches(fn: any): Git.GitRepository;
        /**
         * Get the JSON contents of the path with optional name wildcard and search
         * @method jsonChildContents
         * @for GitWikiRepository
         * @param {String} path
         * @param {String} nameWildcard
         * @param {String} search
         * @param {Function} fn
         * @return {any}
         */
        jsonChildContents(path: string, nameWildcard: string, search: string, fn: any): Git.GitRepository;
        git(): Git.GitRepository;
    }
}
