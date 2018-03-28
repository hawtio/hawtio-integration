/// <reference path="activemq/ts/activemqPlugin.ts"/>
/// <reference path="camel/ts/camelPlugin.ts"/>
/// <reference path="osgi/ts/osgiPlugin.ts"/>
/// <reference path="spring-boot/spring-boot.module.ts"/>

namespace Integration {

  export const integrationModule = angular
    .module('hawtio-integration', [
      ActiveMQ._module.name,
      Camel._module.name,
      Osgi._module.name,
      SpringBoot.springBootModule
    ])
    .run(configureAboutPage)
    .name;

  hawtioPluginLoader.addModule(integrationModule);

}
