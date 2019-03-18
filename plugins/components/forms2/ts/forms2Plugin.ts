/// <reference path="forms2Helpers.ts"/>
namespace HawtioForms {

  export var _module = angular.module(pluginName, []);

  _module.run(() => {
    log.debug("loaded");
  });

  hawtioPluginLoader.addModule(pluginName);
}
