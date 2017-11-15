namespace Karaf {

  export class Feature {

    id: string
    name: string
    version: string
    installed: boolean
    repositoryName: string
    repositoryUri: string

    constructor(name: string, version: string, installed: boolean, repositoryName: string, repositoryUri: string) {
      this.id = name + "/" + version;
      this.name = name;
      this.version = version;
      this.installed = installed;
      this.repositoryName = repositoryName;
      this.repositoryUri = repositoryUri;
    }

    getState(): string {
      return this.installed ? 'installed' : 'uninstalled';
    }
  }
}