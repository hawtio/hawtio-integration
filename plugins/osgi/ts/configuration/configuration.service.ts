/// <reference path="configuration.ts"/>
/// <reference path="configuration-property.ts"/>

namespace Osgi {

  export class ConfigurationService {
    private hawtioConfigAdminMBean: string;
    private configAdminMBean: string;

    constructor(private workspace: Jmx.Workspace, private jolokiaService: JVM.JolokiaService) {
      'ngInject';
      this.hawtioConfigAdminMBean = getHawtioConfigAdminMBean(workspace);
      this.configAdminMBean = getSelectionConfigAdminMBean(workspace);
    }

    isReadWrite(): boolean {
      return !!this.hawtioConfigAdminMBean && !!this.configAdminMBean;
    }

    getConfiguration(id: string): ng.IPromise<Configuration> {
      return this.jolokiaService.execute(this.configAdminMBean, 'getProperties', id)
        .then(result => {
          const properties = [];
          _.values(result)
            .filter(item => item.Key !== 'service.pid')
            .map(item => properties.push(new ConfigurationProperty(item.Key, item.Value)));
          return new Configuration(id, properties);
        });
    }

    addProperty(configuration: Configuration, property: ConfigurationProperty): ng.IPromise<Configuration> {
      configuration.properties.push(property);
      return this.saveAndLoadConfiguration(configuration);
    }

    replaceProperty(configuration: Configuration, oldProperty: ConfigurationProperty, newProperty: ConfigurationProperty): ng.IPromise<Configuration> {
      configuration.properties = configuration.properties.filter(p => p !== oldProperty);
      configuration.properties.push(newProperty);
      return this.saveAndLoadConfiguration(configuration);
    }

    deleteProperty(configuration: Configuration, property: ConfigurationProperty): ng.IPromise<Configuration> {
      configuration.properties = configuration.properties.filter(p => p !== property);
      return this.saveAndLoadConfiguration(configuration);
    }

    saveAndLoadConfiguration(configuration: Configuration): ng.IPromise<Configuration> {
      return this.jolokiaService.execute(this.hawtioConfigAdminMBean, 'configAdminUpdate', configuration.id,
        configuration.getPropertiesAsJson())
        .then(() => this.getConfiguration(configuration.id));
    }

    hasRightsToAddProperty(): boolean {
      return this.workspace.hasInvokeRightsForName(this.configAdminMBean, 'createFactoryConfiguration')
        && this.workspace.hasInvokeRightsForName(this.hawtioConfigAdminMBean, 'configAdminUpdate');
    }

    hasRightsToEditProperties(): boolean {
      return this.workspace.hasInvokeRightsForName(this.hawtioConfigAdminMBean, 'configAdminUpdate');
    }

    hasRightsToDeleteProperties(): boolean {
      return this.workspace.hasInvokeRightsForName(this.hawtioConfigAdminMBean, 'configAdminUpdate');
    }
  }

}
