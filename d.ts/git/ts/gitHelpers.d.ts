/**
 * @module Git
 */
declare module Git {
    function createGitRepository(workspace: Workspace, jolokia: any, localStorage: any): GitRepository;
    var jmxDomain: string;
    var mbeanType: string;
    function hasGit(workspace: Workspace): boolean;
    /**
     * Returns the JMX ObjectName of the git mbean
     * @method getGitMBean
     * @for Git
     * @param {Workspace} workspace
     * @return {String}
     */
    function getGitMBean(workspace: Workspace): string;
    /**
     * Returns the Folder for the git mbean if it can be found
     * @method getGitMBeanFolder
     * @for Git
     * @param {Workspace} workspace
     * @return {Folder}
     */
    function getGitMBeanFolder(workspace: Workspace): Folder;
    /**
     * Returns true if the git mbean is a fabric configuration repository
     * (so we can use it for the fabric plugin)
     * @method isGitMBeanFabric
     * @for Git
     * @param {Workspace} workspace
     * @return {Boolean}
     */
    function isGitMBeanFabric(workspace: Workspace): boolean;
}
