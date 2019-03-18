namespace UIBootstrap {
  var pluginName = "hawtio-ui-bootstrap";
  angular.module(pluginName, ["ui.bootstrap"]);
  hawtioPluginLoader.addModule(pluginName);

  hawtioPluginLoader.addModule("hawtio-compat.transition");
  hawtioPluginLoader.addModule("hawtio-compat.dialog");
  hawtioPluginLoader.addModule("hawtio-compat.modal");
}


