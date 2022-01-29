namespace JVM {

  export const rootPath = 'plugins/jvm';
  export const templatePath = UrlHelpers.join(rootPath, '/html');
  export const pluginName = 'hawtio-jmx-jvm';
  export const log: Logging.Logger = Logger.get(pluginName);
  export const connectionSettingsKey = 'jvmConnect';
  export const logoPath = 'img/icons/jvm/';
  export const logoRegistry = {
    'jetty': logoPath + 'jetty-logo.svg',
    'tomcat': logoPath + 'tomcat-logo.svg',
    'camel': logoPath + 'camel-logo.svg',
    'spring-boot': logoPath + 'spring-logo.svg',
    'java': logoPath + 'java-logo.svg',
    'generic': logoPath + 'java-logo.svg'
  };
  export const proxyEnabledPath = 'proxy/enabled';

  export let proxyEnabled: boolean = true;

}
