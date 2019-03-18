/**
 * @module DataTable
 * @main DataTable
 */
namespace DataTable {
  export const pluginName: string = 'hawtio-ui-datatable';
  export const log: Logging.Logger = Logger.get(pluginName);
  export const _module = angular.module(pluginName, []);
  hawtioPluginLoader.addModule(pluginName);
}
