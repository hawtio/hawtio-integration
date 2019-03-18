namespace Jmx {
  /**
   * a NodeSelection interface so we can expose things like the objectName and the MBean's entries
   *
   * @class NodeSelection
   */
  export interface NodeSelection {
    /**
     * @property text
     * @type string
     */
    text: string;
    /**
     * @property class
     * @type string
     */
    class?: string;
    /**
     * @property key
     * @type string
     * @optional
     */
    key?:string;
    /**
     * @property typeName
     * @type string
     * @optional
     */
    typeName?: string;
    /**
     * @property objectName
     * @type string
     * @optional
     */
    objectName?: string;
    /**
     * @property domain
     * @type string
     * @optional
     */
    domain?: string;
    /**
     * @property entries
     * @type any
     * @optional
     */
    entries?: any;
    /**
     * @property folderNames
     * @type array
     * @optional
     */
    folderNames?: string[];
    /**
     * @property children
     * @type NodeSelection
     * @optional
     */
    children?:Array<NodeSelection>;
    /**
     * @property parent
     * @type NodeSelection
     * @optional
     */
    parent?: NodeSelection;
    /**
     * @property icon
     * @type string
     * @optional
     */
    icon?: string;
    /**
     * @property image
     * @type string
     * @optional
     */
    image?: string;
    /**
     * @property version
     * @type string
     * @optional
     */
    version?: string;
    /**
     * @method get
     * @param {String} key
     * @return {NodeSelection}
     */
    get(key:string): NodeSelection;
    /**
     * @method isFolder
     * @return {boolean}
     */
    isFolder(): boolean;
    /**
     * @method ancestorHasType
     * @param {String} typeName
     * @return {Boolean}
     */
    ancestorHasType(typeName:string): boolean;
    /**
     * @method ancestorHasEntry
     * @param key
     * @param value
     * @return {Boolean}
     */
    ancestorHasEntry(key:string, value): boolean;

    /**
     * @method findDescendant
     * @param {Function} filter
     * @return {NodeSelection}
     */
    findDescendant(filter: (node: NodeSelection) => boolean): NodeSelection | null

    /**
     * @method findAncestor
     * @param {Function} filter
     * @return {NodeSelection}
     */
    findAncestor(filter: (node: NodeSelection) => boolean): NodeSelection | null

    /**
     * @method detach
     */
    detach()
  }

  /**
   * @class Folder
   * @uses NodeSelection
   */
  export class Folder implements NodeSelection {

    constructor(public text:string) {
      this.class = Core.escapeTreeCssStyles(text);
    }

    id:string = null;

    get key():string {
      return this.id;
    }
    set key(key:string) {
      this.id = key;
    }

    get title():string {
      return this.text;
    }
    set title(title: string) {
      this.text = title;
    }

    typeName:string = null;
    nodes = <Array<NodeSelection>>[];

    get children():Array<NodeSelection> {
      return this.nodes;
    }
    set children(items:Array<NodeSelection>) {
      this.nodes = items;
    }

    folderNames:string[] = [];
    domain:string = null;
    objectName:string = null;
    entries = {};
    class: string = null;
    parent:Folder = null;
    isLazy:boolean = false;

    get lazyLoad():boolean {
      return this.isLazy;
    }
    set lazyLoad(isLazy:boolean) {
      this.isLazy = isLazy;
    }

    icon:string = null;
    image:string = null;
    tooltip:string = null;
    entity:any = null;
    version:string = null;
    mbean: Core.JMXMBean & { opByString?: { [name: string]: any } } = null;

    get(key: string): NodeSelection {
      return _.find(this.children, child => child.text === key);
    }

    isFolder(): boolean {
      return this.nodes && this.nodes.length > 0;
    }

    /**
     * Navigates the given paths and returns the value there or null if no value could be found
     * @method navigate
     * @for Folder
     * @param {Array} paths
     * @return {NodeSelection}
     */
    public navigate(...paths: string[]): NodeSelection {
      return paths.reduce((node, path) => node ? node.get(path) : null, this as NodeSelection);
    }

    public hasEntry(key: string, value) {
      var entries = this.entries;
      if (entries) {
        var actual = entries[key];
        return actual && value === actual;
      }
      return false;
    }

    public parentHasEntry(key: string, value) {
      if (this.parent) {
        return this.parent.hasEntry(key, value);
      }
      return false;
    }

    public ancestorHasEntry(key: string, value) {
      var parent = this.parent;
      while (parent) {
        if (parent.hasEntry(key, value))
          return true;
        parent = parent.parent;
      }
      return false;
    }

    public ancestorHasType(typeName: string) {
      var parent = this.parent;
      while (parent) {
        if (typeName === parent.typeName)
          return true;
        parent = parent.parent;
      }
      return false;
    }

    public getOrElse(key: string, defaultValue: Folder = new Folder(key)): Folder {
      let answer = this.get(key);
      if (!answer) {
        answer = defaultValue;
        this.children.push(answer);
        answer.parent = this;
      }
      return answer as Folder;
    }

    public sortChildren(recursive: boolean) {
      var children = this.children;
      if (children) {
        this.children = _.sortBy(children, 'text');
        if (recursive) {
          angular.forEach(children, (child: Folder) => child.sortChildren(recursive));
        }
      }
    }

    public moveChild(child: NodeSelection) {
      if (child && child.parent !== this) {
        child.detach();
        child.parent = this;
        this.children.push(child);
      }
    }

    public insertBefore(child: Folder, referenceFolder: Folder) {
      child.detach();
      child.parent = this;
      var idx = _.indexOf(this.children, referenceFolder);
      if (idx >= 0) {
        this.children.splice(idx, 0, child);
      }
    }

    public insertAfter(child: Folder, referenceFolder: Folder) {
      child.detach();
      child.parent = this;
      var idx = _.indexOf(this.children, referenceFolder);
      if (idx >= 0) {
        this.children.splice(idx + 1, 0, child);
      }
    }

    /**
     * Removes this node from my parent if I have one
     * @method detach
     * @for Folder
     */
    public detach() {
      var oldParent = this.parent;
      if (oldParent) {
        const oldParentChildren = oldParent.children;
        if (oldParentChildren) {
          const idx = oldParentChildren.indexOf(this);
          if (idx < 0) {
            _.remove(oldParent.children, child => child.key === this.key);
          } else {
            oldParentChildren.splice(idx, 1);
          }
        }
        this.parent = null;
      }
    }

    /**
     * Searches this folder and all its descendants for the first folder to match the filter
     * @method findDescendant
     * @for Folder
     * @param {Function} filter
     * @return {Folder}
     */
    public findDescendant(filter: (node: NodeSelection) => boolean): NodeSelection | null {
      if (filter(this)) {
        return this;
      }
      var answer = null;
      angular.forEach(this.children, (child) => {
        if (!answer) {
          answer = child.findDescendant(filter);
        }
      });
      return answer;
    }

    /**
     * Searches this folder and all its ancestors for the first folder to match the filter
     * @method findDescendant
     * @for Folder
     * @param {Function} filter
     * @return {Folder}
     */
    public findAncestor(filter: (node: NodeSelection) => boolean): NodeSelection | null {
      if (filter(this)) {
        return this;
      }

      if (this.parent != null) {
        return this.parent.findAncestor(filter);
      } else {
        return null;
      }
    }
  }
}

