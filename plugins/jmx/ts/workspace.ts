/// <reference path="../../jvm/ts/jolokia/jolokiaService.ts"/>
/// <reference path="tree/tree-event.ts"/>

namespace Jmx {

  const log: Logging.Logger = Logger.get("hawtio-jmx-workspace");
  const logTree: Logging.Logger = Logger.get("hawtio-jmx-workspace-tree");

  const HAWTIO_REGISTRY_MBEAN: string = "hawtio:type=Registry";
  const HAWTIO_TREE_WATCHER_MBEAN: string = "hawtio:type=TreeWatcher";

  /**
   * @class NavMenuItem
   */
  export interface NavMenuItem {
    id: string;
    content: string;
    title?: string;
    isValid?(workspace: Workspace, perspectiveId?: string): any;
    isActive?(worksace: Workspace): boolean;
    href(): any;
  }

  /**
   * @class Workspace
   */
  export class Workspace {
    public operationCounter: number = 0;
    public selection: NodeSelection;
    public tree: Folder = new Folder('MBeans');
    public mbeanTypesToDomain = {};
    public mbeanServicesToDomain = {};
    public attributeColumnDefs = {};
    public onClickRowHandlers = {};
    public treePostProcessors: { [name: string]: (tree: Folder) => void } = {};
    public topLevelTabs: any = undefined
    public subLevelTabs = [];
    public keyToNodeMap = {};
    public pluginRegisterHandle = null;
    public pluginUpdateCounter = null;
    public treeWatchRegisterHandle = null;
    public treeWatcherCounter = null;
    public treeFetched: boolean = false;
    // mapData allows to store arbitrary data on the workspace
    public mapData = {};

    private rootId: string = 'root';
    private separator: string = '-';

    constructor(
      public jolokia: Jolokia.IJolokia,
      public jolokiaStatus: JVM.JolokiaStatus,
      public jmxTreeLazyLoadRegistry,
      public $location: ng.ILocationService,
      public $compile: ng.ICompileService,
      public $templateCache: ng.ITemplateCacheService,
      public localStorage: Storage,
      public $rootScope: ng.IRootScopeService) {

      // set defaults
      if (!('autoRefresh' in localStorage)) {
        localStorage['autoRefresh'] = true;
      }
      if (!('updateRate' in localStorage)) {
        localStorage['updateRate'] = 5000;
      }
    }

    /**
     * Creates a shallow copy child workspace with its own selection and location
     * @method createChildWorkspace
     * @param {ng.ILocationService} location
     * @return {Workspace}
     */
    public createChildWorkspace(location): Workspace {
      const child = new Workspace(this.jolokia, this.jolokiaStatus, this.jmxTreeLazyLoadRegistry,
        this.$location, this.$compile, this.$templateCache, this.localStorage, this.$rootScope);
      // lets copy across all the properties just in case
      _.forEach(this, (value, key) => child[key] = value);
      child.$location = location;
      return child;
    }

    getLocalStorage(key: string): any {
      return this.localStorage[key];
    }

    setLocalStorage(key: string, value: any) {
      this.localStorage[key] = value;
    }

    private jolokiaList(callback, flags): void {
      let listMethod = this.jolokiaStatus.listMethod;
      switch (listMethod) {
        case JVM.JolokiaListMethod.LIST_WITH_RBAC:
          log.debug("Invoking Jolokia list mbean in RBAC mode");
          flags.maxDepth = 9;
          this.jolokia.execute(this.jolokiaStatus.listMBean, "list()", Core.onSuccess(callback, flags));
          break;
        case JVM.JolokiaListMethod.LIST_GENERAL:
        case JVM.JolokiaListMethod.LIST_CANT_DETERMINE:
        default:
          log.debug("Invoking Jolokia list mbean in general mode");
          this.jolokia.list(null, Core.onSuccess(callback, flags));
          break;
      }
    }

    public loadTree() {
      let workspace = this;
      if (this.jolokia['isDummy']) {
        setTimeout(() => {
          workspace.setTreeFetched();
          workspace.populateTree({ value: {} });
        }, 10);
        return;
      }

      let flags = {
        ignoreErrors: true,
        error: (response) => {
          workspace.setTreeFetched();
          log.debug("Error fetching JMX tree:", response);
        },
        ajaxError: (response) => {
          workspace.setTreeFetched();
          log.debug("Error fetching JMX tree:", response);
        }        
      };
      log.debug("Jolokia:", this.jolokia);
      this.jolokiaList((response) => {
        this.jolokiaStatus.xhr = null;
        workspace.setTreeFetched();
        workspace.populateTree({ value: this.unwindResponseWithRBACCache(response) });
      }, flags);
    }

    /**
     * Adds a post processor of the tree to swizzle the tree metadata after loading
     * such as correcting any typeName values or CSS styles by hand
     * @method addTreePostProcessor
     * @param {Function} processor
     */
    public addTreePostProcessor(processor: (tree: Folder) => void) {
      let numKeys = _.keys(this.treePostProcessors).length;
      let nextKey = numKeys + 1;
      return this.addNamedTreePostProcessor(nextKey + '', processor);
    }

    public addNamedTreePostProcessor(name: string, processor: (tree: Folder) => void) {
      this.treePostProcessors[name] = processor;
      let tree = this.tree;
      if (this.treeFetched && tree) {
        // the tree is loaded already so lets process it now :)
        processor(tree);
      }
      return name;
    }

    public removeNamedTreePostProcessor(name: string) {
      delete this.treePostProcessors[name];
    }

    public maybeMonitorPlugins() {
      if (this.treeContainsDomainAndProperties("hawtio", { type: "Registry" })) {
        if (this.pluginRegisterHandle === null) {
          let callback = angular.bind(this, this.maybeUpdatePlugins) as (...response: Jolokia.IResponse[]) => void;
          this.pluginRegisterHandle = this.jolokia.register(callback, {
            type: "read",
            mbean: HAWTIO_REGISTRY_MBEAN,
            attribute: "UpdateCounter"
          });
        }
      } else {
        if (this.pluginRegisterHandle !== null) {
          this.jolokia.unregister(this.pluginRegisterHandle);
          this.pluginRegisterHandle = null;
          this.pluginUpdateCounter = null;
        }
      }

      // lets also listen to see if we have a JMX tree watcher
      if (this.treeContainsDomainAndProperties("hawtio", { type: "TreeWatcher" })) {
        if (this.treeWatchRegisterHandle === null) {
          let callback = angular.bind(this, this.maybeReloadTree) as (...response: Jolokia.IResponse[]) => void;
          this.treeWatchRegisterHandle = this.jolokia.register(callback, {
            type: "read",
            mbean: HAWTIO_TREE_WATCHER_MBEAN,
            attribute: "Counter"
          });
        }
      }
    }

    public maybeUpdatePlugins(response: Jolokia.IResponse): void {
      if (this.pluginUpdateCounter === null) {
        this.pluginUpdateCounter = response.value;
        return;
      }
      if (this.pluginUpdateCounter !== response.value) {
        if (Core.parseBooleanValue(localStorage['autoRefresh'])) {
          window.location.reload();
        }
      }
    }

    public maybeReloadTree(response: Jolokia.IResponse): void {
      let counter = response.value;
      if (this.treeWatcherCounter === null) {
        this.treeWatcherCounter = counter;
        return;
      }
      if (this.treeWatcherCounter !== counter) {
        this.treeWatcherCounter = counter;
        this.jolokiaList(
          (response) => this.populateTree({ value: this.unwindResponseWithRBACCache(response) }),
          { ignoreErrors: true, maxDepth: 8 });
      }
    }

    /**
     * Processes response from jolokia list - if it contains "domains" and "cache" properties
     * @param response
     */
    public unwindResponseWithRBACCache(response: any): Core.JMXDomains {
      if (response['domains'] && response['cache']) {
        // post process cached RBAC info
        for (let domainName in response['domains']) {
          let domainClass = Core.escapeDots(domainName);
          let domain = response['domains'][domainName] as Core.JMXDomain;
          for (let mbeanName in domain) {
            if (_.isString(domain[mbeanName])) {
              domain[mbeanName] = response['cache']["" + domain[mbeanName]] as Core.JMXMBean;
            }
          }
        }
        return response['domains'];
      }
      return response;
    }

    public populateTree(response: { value: Core.JMXDomains }): void {
      log.debug("JMX tree has been loaded, data:", response.value);

      this.mbeanTypesToDomain = {};
      this.mbeanServicesToDomain = {};
      this.keyToNodeMap = {};

      let newTree = new Folder('MBeans');
      newTree.key = this.rootId;
      let domains = response.value;
      _.forEach(domains, (domain, domainName) => {
        // domain name is displayed in the tree, so let's escape it here
        // Core.escapeHtml() and _.escape() cannot be used, as escaping '"' breaks Camel tree...
        this.populateDomainFolder(newTree, this.escapeTagOnly(domainName), domain);
      });

      newTree.sortChildren(true);

      // now lets mark the nodes with no children as lazy loading...
      this.enableLazyLoading(newTree);
      this.tree = newTree;

      let processors = this.treePostProcessors;
      _.forIn(processors, (processor: (tree: Folder) => void, key: string) => {
        log.debug("Running tree post processor:", key);
        processor(newTree);
      });

      this.maybeMonitorPlugins();

      this.jmxTreeUpdated();
    }

    setTreeFetched() {
      this.treeFetched = true;
      let rootScope = this.$rootScope;
      if (rootScope) {
        Core.$apply(rootScope);
        rootScope.$broadcast(TreeEvent.Fetched);
      }
    }
    
    jmxTreeUpdated() {
      let rootScope = this.$rootScope;
      if (rootScope) {
        Core.$apply(rootScope);
        rootScope.$broadcast(TreeEvent.Updated);
      }
    }

    private initFolder(folder: Folder, domain: string, folderNames: string[]): void {
      folder.domain = domain;
      if (!folder.key) {
        folder.key = this.rootId + this.separator + folderNames.join(this.separator);
      }
      folder.folderNames = folderNames;
      logTree.debug("    folder: domain=" + folder.domain + ", key=" + folder.key);
    }

    private populateDomainFolder(tree: Folder, domainName: string, domain: Core.JMXDomain): void {
      logTree.debug("JMX tree domain: " + domainName);
      let domainClass = Core.escapeDots(domainName);
      let folder = this.folderGetOrElse(tree, domainName);
      this.initFolder(folder, domainName, [domainName]);
      _.forEach(domain, (mbean, mbeanName) => {
        this.populateMBeanFolder(folder, domainClass, mbeanName, mbean);
      });
    }

    /**
     * Escape only '<' and '>' as opposed to Core.escapeHtml() and _.escape()
     *
     * @param {string} str string to be escaped
    */
    private escapeTagOnly(str: string): string {
      let tagChars = {
        "<": "&lt;",
        ">": "&gt;"
      };
      if (!angular.isString(str)) {
        return str;
      }
      let escaped = "";
      for (let i = 0; i < str.length; i++) {
        let c = str.charAt(i);
        escaped += tagChars[c] || c;
      }
      return escaped;
    }

    private populateMBeanFolder(domainFolder: Folder, domainClass: string, mbeanName: string, mbean: Core.JMXMBean): void {
      logTree.debug("  JMX tree mbean: " + mbeanName);

      let entries = {};
      let paths = [];
      let typeName = null;
      let serviceName = null;
      mbeanName.split(',').forEach((prop) => {
        // do not use split('=') as it splits wrong when there is a space in the mbean name
        let kv = this.splitMBeanProperty(prop);
        let propKey = kv[0];
        // mbean property value is displayed in the tree, so let's escape it here
        // Core.escapeHtml() and _.escape() cannot be used, as escaping '"' breaks Camel tree...
        let propValue = this.escapeTagOnly(kv[1] || propKey);
        entries[propKey] = propValue;
        let moveToFront = false;
        let lowerKey = propKey.toLowerCase();
        if (lowerKey === "type") {
          typeName = propValue;
          // if the type name value already exists in the root node
          // of the domain then lets move this property around too
          if (domainFolder.get(propValue)) {
            moveToFront = true;
          }
        }
        if (lowerKey === "service") {
          serviceName = propValue;
        }
        if (moveToFront) {
          paths.unshift(propValue);
        } else {
          paths.push(propValue);
        }
      });

      let folder = domainFolder;
      let domainName = domainFolder.domain;
      let folderNames = _.clone(domainFolder.folderNames);
      let lastPath = paths.pop();
      paths.forEach((path) => {
        folder = this.folderGetOrElse(folder, path);
        if (folder) {
          folderNames.push(path);
          this.configureFolder(folder, domainName, domainClass, folderNames, path);
        }
      });

      if (folder) {
        folder = this.folderGetOrElse(folder, lastPath);
        if (folder) {
          // lets add the various data into the folder
          folder.entries = entries;
          folderNames.push(lastPath);
          this.configureFolder(folder, domainName, domainClass, folderNames, lastPath);
          folder.text = Core.trimQuotes(lastPath);
          folder.objectName = domainName + ":" + mbeanName;
          folder.mbean = mbean;
          folder.typeName = typeName;

          if (serviceName) {
            this.addFolderByDomain(folder, domainName, serviceName, this.mbeanServicesToDomain);
          }
          if (typeName) {
            this.addFolderByDomain(folder, domainName, typeName, this.mbeanTypesToDomain);
          }
        }
      } else {
        log.info("No folder found for last path: " + lastPath);
      }
    }

    private folderGetOrElse(folder: Folder, name: string): Folder {
      return folder ? folder.getOrElse(name) : null;
    }

    private splitMBeanProperty(property: string): [string, string] {
      let pos = property.indexOf('=');
      if (pos > 0) {
        return [property.substr(0, pos), property.substr(pos + 1)];
      } else {
        return [property, property];
      }
    }

    public configureFolder(folder: Folder, domainName: string, domainClass: string, folderNames: string[], path: string): Folder {
      this.initFolder(folder, domainName, _.clone(folderNames));
      this.keyToNodeMap[folder.key] = folder;
      let classes = "";
      let typeKey = _.filter(_.keys(folder.entries), key => key.toLowerCase().indexOf("type") >= 0);
      if (typeKey.length) {
        // last path
        _.forEach(typeKey, key => {
          let typeName = folder.entries[key];
          if (!folder.ancestorHasEntry(key, typeName)) {
            classes += " " + domainClass + this.separator + typeName;
          }
        });
      } else {
        // folder
        let kindName = _.last(folderNames);
        if (kindName === path) {
          kindName += "-folder";
        }
        if (kindName) {
          classes += " " + domainClass + this.separator + kindName;
        }
      }
      folder.class = Core.escapeTreeCssStyles(classes);
      return folder;
    }

    private addFolderByDomain(folder: Folder, domainName: string, typeName: string, owner: any): void {
      let map = owner[typeName];
      if (!map) {
        map = {};
        owner[typeName] = map;
      }
      let value = map[domainName];
      if (!value) {
        map[domainName] = folder;
      } else {
        let array = null;
        if (angular.isArray(value)) {
          array = value;
        } else {
          array = [value];
          map[domainName] = array;
        }
        array.push(folder);
      }
    }

    private enableLazyLoading(folder: Folder): void {
      const children = folder.children;
      if (children && children.length) {
        angular.forEach(children, (child: Folder) => this.enableLazyLoading(child));
      } else {
        // we have no children so enable lazy loading if we have a custom loader registered
        const lazyFunction = Jmx.findLazyLoadingFunction(this, folder);
        if (lazyFunction) {
          folder.lazyLoad = true;
        } else {
          folder.icon = 'fa fa-cube';
        }
      }
    }

    /**
     * Returns the hash query argument to append to URL links
     * @method hash
     * @return {String}
     */
    public hash() {
      let hash = this.$location.search();
      let params = Core.hashToString(hash);
      if (params) {
        return "?" + params;
      }
      return "";
    }

    /**
     * Returns the currently active tab
     * @method getActiveTab
     * @return {Boolean}
     */
    public getActiveTab() {
      let workspace = this;
      return _.find(this.topLevelTabs, tab => {
        if (!angular.isDefined(tab.isActive)) {
          return workspace.isLinkActive(tab.href());
        } else {
          return tab.isActive(workspace);
        }
      });
    }

    private getStrippedPathName() {
      let pathName = Core.trimLeading((this.$location.path() || '/'), "#");
      pathName = pathName.replace(/^\//, '');
      return pathName;
    }

    public linkContains(...words: String[]): boolean {
      let pathName = this.getStrippedPathName();
      return _.every(words, (word: string) => pathName.indexOf(word) !== 0);
    }

    /**
     * Returns true if the given link is active. The link can omit the leading # or / if necessary.
     * The query parameters of the URL are ignored in the comparison.
     * @method isLinkActive
     * @param {String} href
     * @return {Boolean} true if the given link is active
     */
    public isLinkActive(href: string): boolean {
      // lets trim the leading slash
      let pathName = this.getStrippedPathName();

      let link = Core.trimLeading(href, "#");
      link = link.replace(/^\//, '');
      // strip any query arguments
      let idx = link.indexOf('?');
      if (idx >= 0) {
        link = link.substring(0, idx);
      }
      if (!pathName.length) {
        return link === pathName;
      } else {
        return _.startsWith(pathName, link);
      }
    }

    /**
     * Returns true if the given link is active. The link can omit the leading # or / if necessary.
     * The query parameters of the URL are ignored in the comparison.
     * @method isLinkActive
     * @param {String} href
     * @return {Boolean} true if the given link is active
     */
    public isLinkPrefixActive(href: string): boolean {
      // lets trim the leading slash
      let pathName = this.getStrippedPathName();

      let link = Core.trimLeading(href, "#");
      link = link.replace(/^\//, '');
      // strip any query arguments
      let idx = link.indexOf('?');
      if (idx >= 0) {
        link = link.substring(0, idx);
      }
      return _.startsWith(pathName, link);
    }

    /**
     * Returns true if the tab query parameter is active or the URL starts with the given path
     * @method isTopTabActive
     * @param {String} path
     * @return {Boolean}
     */
    public isTopTabActive(path: string): boolean {
      let tab = this.$location.search()['tab'];
      if (angular.isString(tab)) {
        return _.startsWith(tab, path);
      }
      return this.isLinkActive(path);
    }

    public isMainTabActive(path: string): boolean {
      let tab = this.$location.search()['main-tab'];
      if (angular.isString(tab)) {
        return tab === path;
      }
      return false;
    }

    /**
     * Returns the selected mbean name if there is one
     * @method getSelectedMBeanName
     * @return {String}
     */
    public getSelectedMBeanName(): string {
      let selection = this.getSelectedMBean();
      if (selection) {
        return selection.objectName;
      }
      return null;
    }

    public getSelectedMBean(): NodeSelection {
      if (this.selection) {
        return this.selection;
      }
      log.debug("Location:", this.$location);
      let nid = this.$location.search()['nid'];
      if (nid && this.tree) {
        let answer = this.tree.findDescendant(node => nid === node.key);
        if (!this.selection) {
          this.selection = answer;
        }
        return answer;
      }
      return null;
    }

    /**
     * Returns true if the path is valid for the current selection
     * @method validSelection
     * @param {String} uri
     * @return {Boolean}
     */
    public validSelection(uri: string) {
      // TODO
      return true;
    }

    /**
     * In cases where we have just deleted something we typically want to change
     * the selection to the parent node
     * @method removeAndSelectParentNode
     */
    public removeAndSelectParentNode() {
      let selection = this.selection;
      if (selection) {
        let parent = selection.parent;
        if (parent) {
          // lets remove the selection from the parent so we don't do any more JMX attribute queries on the children
          // or include it in table views etc
          // would be nice to eagerly remove the tree node too?
          let idx = parent.children.indexOf(selection);
          if (idx < 0) {
            idx = _.findIndex(parent.children, n => n.key === selection.key);
          }
          if (idx >= 0) {
            parent.children.splice(idx, 1);
          }
          this.updateSelectionNode(parent);
        }
      }
    }

    public selectParentNode() {
      let selection = this.selection;
      if (selection) {
        let parent = selection.parent;
        if (parent) {
          this.updateSelectionNode(parent);
        }
      }
    }

    /**
     * Returns the view configuration key for the kind of selection
     * for example based on the domain and the node type
     * @method selectionViewConfigKey
     * @return {String}
     */
    public selectionViewConfigKey(): string {
      return this.selectionConfigKey("view/");
    }

    /**
     * Returns a configuration key for a node which is usually of the form
     * domain/typeName or for folders with no type, domain/name/folder
     * @method selectionConfigKey
     * @param {String} prefix
     * @return {String}
     */
    public selectionConfigKey(prefix: string = ""): string {
      let key: string = null;
      let selection = this.selection;
      if (selection) {
        // lets make a unique string for the kind of select
        key = prefix + selection.domain;
        let typeName = selection.typeName;
        if (!typeName) {
          typeName = selection.text;
        }
        key += "/" + typeName;
        if (selection.isFolder()) {
          key += "/folder";
        }
      }
      return key;
    }

    public moveIfViewInvalid() {
      let workspace = this;
      let uri = Core.trimLeading(this.$location.path(), "/");
      if (this.selection) {
        let key = this.selectionViewConfigKey();
        if (this.validSelection(uri)) {
          // lets remember the previous selection
          this.setLocalStorage(key, uri);
          return false;
        } else {
          log.info("the uri '" + uri + "' is not valid for this selection");
          // lets look up the previous preferred value for this type
          let defaultPath = this.getLocalStorage(key);
          if (!defaultPath || !this.validSelection(defaultPath)) {
            // lets find the first path we can find which is valid
            defaultPath = null;
            angular.forEach(this.subLevelTabs, (tab) => {
              let fn = tab.isValid;
              if (!defaultPath && tab.href && angular.isDefined(fn) && fn(workspace)) {
                defaultPath = tab.href();
              }
            });
          }
          if (!defaultPath) {
            defaultPath = "#/jmx/help";
          }
          log.info("moving the URL to be", defaultPath);
          if (_.startsWith(defaultPath, "#")) {
            defaultPath = defaultPath.substring(1);
          }
          this.$location.path(defaultPath);
          return true;
        }
      } else {
        return false;
      }
    }

    public updateSelectionNode(node: NodeSelection) {
      this.selection = node;
      let key: string = null;
      if (node) {
        key = node.key;
      }
      if (key) {
        let $location = this.$location;
        let q = $location.search();
        q['nid'] = key;
        $location.search(q);
      }
      // Broadcast an event so other parts of the UI can update accordingly
      this.broadcastSelectionNode();
    }

    public broadcastSelectionNode(): void {
      if (this.selection) {
        this.$rootScope.$broadcast(TreeEvent.NodeSelected, this.selection);
      }
    }

    private matchesProperties(entries, properties): boolean {
      if (!entries) return false;
      for (let key in properties) {
        let value = properties[key];
        if (!value || entries[key] !== value) {
          return false;
        }
      }
      return true;
    }

    public hasInvokeRightsForName(objectName: string, ...methods: string[]): boolean {
      // allow invoke by default, same as in hasInvokeRight() below
      if (!objectName) {
        return true;
      }
      let mbean = Core.parseMBean(objectName);
      if (!mbean) {
        log.debug("Failed to parse mbean name", objectName);
        return true;
      }
      let mbeanFolder = this.findMBeanWithProperties(mbean.domain, mbean.attributes);
      if (!mbeanFolder) {
        log.debug("Failed to find mbean folder with name", objectName);
        return true;
      }
      return this.hasInvokeRights.apply(this, [mbeanFolder].concat(methods));
    }

    public hasInvokeRights(selection: NodeSelection, ...methods: string[]): boolean {
      if (!selection) {
        return true;
      }
      let selectionFolder = selection as Folder;
      let mbean = selectionFolder.mbean;
      if (!mbean) {
        return true;
      }
      let canInvoke = true;
      if (angular.isDefined(mbean.canInvoke)) {
        canInvoke = mbean.canInvoke;
      }
      if (canInvoke && methods && methods.length > 0) {
        let opsByString = mbean['opByString'];
        let ops = mbean['op'];
        if (opsByString && ops) {
          methods.forEach((method) => {
            if (!canInvoke) {
              return;
            }
            let op = null;
            if (_.endsWith(method, ')')) {
              op = opsByString[method];
            } else {
              op = ops[method];
            }
            if (!op) {
              log.debug("Could not find method:", method, " to check permissions, skipping");
              return;
            }
            canInvoke = this.resolveCanInvoke(op);
          });
        }
      }
      return canInvoke;
    }

    private resolveCanInvoke(op: any): boolean {
      // for single method
      if (!angular.isArray(op)) {
        return angular.isDefined(op.canInvoke) ? op.canInvoke : true;
      }

      // for overloaded methods
      // returns true only if all overloaded methods can be invoked (i.e. canInvoke=true)
      let cantInvoke = _.find(op, (o) =>
        angular.isDefined(o.canInvoke) && !o.canInvoke
      );
      return !angular.isDefined(cantInvoke);
    }

    public treeContainsDomainAndProperties(domainName: string, properties = null): boolean {
      let workspace = this;
      let tree = workspace.tree;
      if (!tree) {
        return false;
      }

      let folder = tree.get(domainName);
      if (!folder) {
        return false;
      }

      if (properties) {
        let children = folder.children || [];
        let checkProperties = (node) => {
          if (!this.matchesProperties(node.entries, properties)) {
            if (node.domain === domainName && node.children && node.children.length > 0) {
              return node.children.some(checkProperties);
            } else {
              return false;
            }
          } else {
            return true;
          }
        };
        return children.some(checkProperties);
      }
      return true;
    }

    private matches(folder: NodeSelection, properties, propertiesCount): boolean {
      if (!folder) {
        return false;
      }

      let entries = folder.entries;
      if (properties) {
        if (!entries) return false;
        for (let key in properties) {
          const entryValue = entries[key];
          let propertyValue = properties[key];
          if (!propertyValue) {
            return false;
          } else if (_.startsWith(propertyValue, '*')) {
            if (!_.endsWith(entryValue, propertyValue.substr(1))) {
              return false;
            }
          } else if (_.endsWith(propertyValue, '*')) {
            if (!_.startsWith(entryValue, propertyValue.substr(0, propertyValue.length - 1))) {
              return false;
            }
          } else if (entryValue !== propertyValue) {
            return false;
          }
        }
      }
      if (propertiesCount) {
        return entries && Object.keys(entries).length === propertiesCount;
      }
      return true;
    }

    // only display stuff if we have an mbean with the given properties
    public hasDomainAndProperties(domainName: string, properties = null, propertiesCount = null): boolean {
      let node = this.selection;
      if (node) {
        return this.matches(node, properties, propertiesCount) && node.domain === domainName;
      }
      return false;
    }

    // only display stuff if we have an mbean with the given properties
    public findMBeanWithProperties(domainName: string, properties = null, propertiesCount = null): any {
      let tree = this.tree;
      if (tree) {
        return this.findChildMBeanWithProperties(tree.get(domainName), properties, propertiesCount);
      }
      return null;
    }

    public findChildMBeanWithProperties(folder, properties = null, propertiesCount = null): any {
      let workspace = this;
      if (folder) {
        let children = folder.children;
        if (children) {
          let answer = _.find(children, node => this.matches(node, properties, propertiesCount));
          if (answer) {
            return answer;
          }
          answer = _.find(children.map(node => workspace.findChildMBeanWithProperties(node, properties, propertiesCount)), node => node);
          if (answer) {
            return answer;
          }
        }
      }
      return null;
    }

    public selectionHasDomainAndLastFolderName(objectName: string, lastName: string): boolean {
      let lastNameLower = (lastName || "").toLowerCase();
      function isName(name) {
        return (name || "").toLowerCase() === lastNameLower
      }
      let node = this.selection;
      if (node) {
        if (objectName === node.domain) {
          let folders = node.folderNames;
          if (folders) {
            let last = _.last(folders);
            return (isName(last) || isName(node.text)) && node.isFolder() && !node.objectName;
          }
        }
      }
      return false;
    }

    public selectionHasDomain(domainName: string): boolean {
      let node = this.selection;
      if (node) {
        return domainName === node.domain;
      }
      return false;
    }

    public selectionHasDomainAndType(objectName: string, typeName: string): boolean {
      let node = this.selection;
      if (node) {
        return objectName === node.domain && typeName === node.typeName;
      }
      return false;
    }

    /**
     * Returns true if this workspace has any mbeans at all
     */
    hasMBeans() {
      let answer = false;
      let tree = this.tree;
      if (tree) {
        let children = tree.children;
        if (_.isArray(children) && children.length > 0) {
          answer = true;
        }
      }
      return answer;
    }

    hasFabricMBean() {
      return this.hasDomainAndProperties('io.fabric8', { type: 'Fabric' });
    }
    isFabricFolder() {
      return this.hasDomainAndProperties('io.fabric8');
    }
    isCamelContext() {
      return this.hasDomainAndProperties('org.apache.camel', { type: 'context' });
    }
    isCamelFolder() {
      return this.hasDomainAndProperties('org.apache.camel');
    }
    isEndpointsFolder() {
      return this.selectionHasDomainAndLastFolderName('org.apache.camel', 'endpoints');
    }
    isEndpoint() {
      return this.hasDomainAndProperties('org.apache.camel', { type: 'endpoints' });
    }
    isRoutesFolder() {
      return this.selectionHasDomainAndLastFolderName('org.apache.camel', 'routes')
    }
    isRoute() {
      return this.hasDomainAndProperties('org.apache.camel', { type: 'routes' });
    }
    isComponentsFolder() {
      return this.selectionHasDomainAndLastFolderName('org.apache.camel', 'components');
    }
    isComponent() {
      return this.hasDomainAndProperties('org.apache.camel', { type: 'components' });
    }
    isDataformatsFolder() {
      return this.selectionHasDomainAndLastFolderName('org.apache.camel', 'dataformats');
    }
    isDataformat() {
      return this.hasDomainAndProperties('org.apache.camel', { type: 'dataformats' });
    }

    isOsgiFolder() {
      return this.hasDomainAndProperties('osgi.core');
    }
    isKarafFolder() {
      return this.hasDomainAndProperties('org.apache.karaf');
    }
    isOsgiCompendiumFolder() {
      return this.hasDomainAndProperties('osgi.compendium');
    }
  }
}
