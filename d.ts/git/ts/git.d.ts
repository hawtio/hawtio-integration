/// <reference path="../../includes.d.ts" />
/// <reference path="gitHelpers.d.ts" />
/**
 * @module Git
 * @main Git
 */
declare module Git {
    /**
     * Provides an interface to interacting with some kind of Git like
     * file and source control system which is versioned
     * @class GitRepository
     */
    interface GitRepository {
        /**
         * Returns repository label
         * @method getRepositoryLabel
         * @param {Function} fn
         * @param {Function} error
         */
        getRepositoryLabel(fn: any, error: any): any;
        /**
         * Returns the file metadata if the file or directory exists or null if it does not exist
         * @method exists
         * @param {String} branch
         * @param {String} path
         * @param {Function} fn
         * @return is used if no function is provided to trigger a synchronous call, returns true if file exists, false otherwise
         */
        exists(branch: string, path: string, fn: any): Boolean;
        /**
         * Read the contents of a file or directory
         * with text or children being returned and a directory flag
         * @method read
         * @param {String} branch
         * @param {String} path
         * @param {Function} fn
         */
        read(branch: string, path: string, fn: any): any;
        /**
         * Completes the available path or file names given the branch and completion text
         * @method completePath
         * @param {String} branch
         * @param {String} completionText
         * @param {Boolean} directoriesOnly
         * @param {Function} fn
         */
        completePath(branch: string, completionText: string, directoriesOnly: boolean, fn: any): any;
        /**
         * Write the content of a file
         * @method write
         * @param {String} branch
         * @param {String} commitMessage
         * @param {String} contents
         * @param {Function} fn
         */
        write(branch: string, path: string, commitMessage: string, contents: string, fn: any): any;
        /**
         * Write the content of a file
         * @method write
         * @param {String} branch
         * @param {String} commitMessage
         * @param {String} contents
         * @param {Function} fn
         */
        writeBase64(branch: string, path: string, commitMessage: string, contents: string, fn: any): any;
        /**
         * Creates a new directory of the given name
         * @method createDirectory
         * @param {String} branch
         * @param {String} path
         * @param {String} commitMessage
         * @param {Function} fn
         */
        createDirectory(branch: string, path: string, commitMessage: string, fn: any): any;
        /**
         * Reverts to a specific version of the file
         * @method revertTo
         * @param {String} objectId
         * @param {String} blobPath
         * @param {String} commitMessage
         * @param {Function} fn
         *
         */
        revertTo(branch: string, objectId: string, blobPath: string, commitMessage: string, fn: any): any;
        /**
         * Renames a file or moves a file to a new location
         * @method rename
         * @param {String} branch
         * @param {String} oldPath
         * @param {String} newPath
         * @param {String} commitMessage
         * @param {Function} fn
         */
        rename(branch: string, oldPath: string, newPath: string, commitMessage: string, fn: any): any;
        /**
         * Removes a file if it exists
         * @method remove
         * @param {String} branch
         * @param {String} path
         * @param {String} commitMessage
         * @param {Function} fn
         */
        remove(branch: string, path: string, commitMessage: string, fn: any): any;
        /**
         * returns the commit history of a directory or file
         * @method history
         * @param {String} branch
         * @param {String} objectId
         * @param {String} path
         * @param {Number} number
         * @param {Function} fn
         */
        history(branch: string, objectId: string, path: string, limit: number, fn: any): any;
        /**
         * Get the contents of a blobPath for a given commit objectId
         * @method getContent
         * @param {String} object Id
         * @param {String} blobPath
         * @param {Function} fn
         */
        getContent(objectId: string, blobPath: string, fn: any): any;
        /**
         * Get the list of branches
         * @method branches
         * @param {Function} fn
         */
        branches(fn: any): any;
        /**
         * Get the JSON contents of children in a directory matching a name wildcard and content search
         * @method readJsonChildContent
         * @param {String} path
         * @param {String} nameWildcard
         * @param {String} search
         * @param {Function} fn
         */
        readJsonChildContent(path: string, nameWildcard: string, search: string, fn: any): any;
        /**
         * Returns the diff of this commit verses the previous or another commit
         * @method diff
         * @param {String} objectId
         * @param {String} baseObjectId
         * @param {String} path
         * @param {Function} fn
         */
        diff(objectId: string, baseObjectId: string, path: string, fn: any): any;
        /**
         * Returns a list of commit tree info objects for the given commit ID
         *
         * @method commitTree
         * @param {String} commitId
         * @param {Function} fn
         */
        commitTree(commitId: string, fn: any): any;
        /**
         * Returns details of a commit for the given commit ID
         *
         * @method commitInfo
         * @param {String} commitId
         * @param {function} fn
         */
        commitInfo(commitId: string, fn: any): any;
        /**
         * Returns the user name
         * @method getUserName
         * @return {String}
         */
        getUserName(): string;
        /**
         * Returns the user's email address
         * @method getUserEmail
         * @return {String}
         */
        getUserEmail(): string;
    }
    /**
     * A default implementation which uses jolokia and the
     * GitFacadeMXBean over JMX
     *
     * @class JolokiaGit
     * @uses GitRepository
     *
     */
    class JolokiaGit implements GitRepository {
        mbean: string;
        jolokia: any;
        localStorage: any;
        userDetails: any;
        branch: string;
        constructor(mbean: string, jolokia: any, localStorage: any, userDetails: any, branch?: string);
        getRepositoryLabel(fn: any, error: any): any;
        exists(branch: string, path: string, fn: any): Boolean;
        read(branch: string, path: string, fn: any): any;
        write(branch: string, path: string, commitMessage: string, contents: string, fn: any): any;
        writeBase64(branch: string, path: string, commitMessage: string, contents: string, fn: any): any;
        createDirectory(branch: string, path: string, commitMessage: string, fn: any): any;
        revertTo(branch: string, objectId: string, blobPath: string, commitMessage: string, fn: any): any;
        rename(branch: string, oldPath: string, newPath: string, commitMessage: string, fn: any): any;
        remove(branch: string, path: string, commitMessage: string, fn: any): any;
        completePath(branch: string, completionText: string, directoriesOnly: boolean, fn: any): any;
        history(branch: string, objectId: string, path: string, limit: number, fn: any): any;
        commitTree(commitId: string, fn: any): any;
        commitInfo(commitId: string, fn: any): any;
        diff(objectId: string, baseObjectId: string, path: string, fn: any): any;
        getContent(objectId: string, blobPath: string, fn: any): any;
        readJsonChildContent(path: string, nameWildcard: string, search: string, fn: any): any;
        branches(fn: any): any;
        getUserName(): string;
        getUserEmail(): string;
    }
}
