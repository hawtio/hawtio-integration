namespace JVM {

  export const rootPath = 'plugins/jvm';
  export const templatePath = UrlHelpers.join(rootPath, '/html');
  export const pluginName = 'hawtio-jmx-jvm';
  export const log: Logging.Logger = Logger.get(pluginName);
  export const connectionSettingsKey = 'jvmConnect';
  export const logoPath = 'img/icons/jvm/';
  export const logoRegistry = {
    'jetty': logoPath + 'jetty-logo-80x22.png',
    'tomcat': logoPath + 'tomcat-logo.gif',
    'generic': logoPath + 'java-logo.svg'
  };

}
