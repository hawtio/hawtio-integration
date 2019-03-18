/// <reference path="forms2Plugin.ts"/>

namespace HawtioForms {
  _module.factory('ControlMappingRegistry', [() => {
    var controlMap = {};
    var answer = {
      hasMapping: (name:string) => {
        if (!name) {
          return false;
        }
        return (name.toLowerCase() in controlMap);
      },
      addMapping: (name:string, controlType: string) => {
        controlMap[name.toLowerCase()] = controlType;
      },
      getMapping: (name:string):string => {
        if (!name) {
          return undefined;
        }
        var answer = controlMap[name.toLowerCase()];
        if (!answer) {
          return name;
        }
        return answer;
      },
      removeMapping: (name:string):string => {
        var answer = undefined;
        if (name.toLowerCase() in controlMap) {
          answer = controlMap[name.toLowerCase()];
          delete controlMap[name.toLowerCase()];
        }
        return answer;
      },
      iterate: (iter:(controlType:string, name:string) => void) => {
        _.forIn(controlMap, iter);
      }
    }
    /* Set up some defaults */
    _.forEach([ "int",
      "number",
      "integer",
      "long",
      "short",
      "java.lang.integer",
      "java.lang.long",
      "float",
      "double",
      "java.lang.float",
      "java.lang.double"
    ], (name) => answer.addMapping(name, 'number'));

    _.forEach(["boolean",
      "bool",
      "java.lang.boolean"
    ], (name) => answer.addMapping(name, 'checkbox'));

    answer.addMapping('password', 'password');
    answer.addMapping('hidden', 'hidden');
    answer.addMapping('static', 'static');
    answer.addMapping('enum', 'select');
    answer.addMapping('choice', 'radio-group');
    answer.addMapping('multiple', 'multiple-select');
    _.forEach(["string",
      "text",
      "java.lang.string"
    ], (name) => answer.addMapping(name, 'text'));
    
    return answer;
  }]);
}
