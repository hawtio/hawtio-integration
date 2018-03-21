/// <reference path='type-converters-statistics.ts'/>
/// <reference path="type-converter.ts"/>

namespace Camel {

  export class TypeConvertersService {

    constructor(private jolokiaService: JVM.JolokiaService, private treeService: Jmx.TreeService) {
      'ngInject';
    }

    enableStatistics(): ng.IPromise<any> {
      return this.getTypeConverterObjectName()
        .then(objectName => this.jolokiaService.setAttribute(objectName, 'StatisticsEnabled', true));
    }

    disableStatistics(): ng.IPromise<any> {
      return this.getTypeConverterObjectName()
        .then(objectName => this.jolokiaService.setAttribute(objectName, 'StatisticsEnabled', false));
    }

    resetStatistics(): ng.IPromise<any> {
      return this.getTypeConverterObjectName()
        .then(objectName => this.jolokiaService.execute(objectName, 'resetTypeConversionCounters'));
    }

    getStatistics(): ng.IPromise<any> {
      const attributes = ['AttemptCounter', 'HitCounter', 'MissCounter', 'FailedCounter'];
      return this.getTypeConverterObjectName()
        .then(objectName => this.jolokiaService.getAttributes(objectName, attributes))
        .then(object => new TypeConvertersStatistics(object));
    }

    getTypeConverters(): ng.IPromise<TypeConverter[]> {
      return this.getTypeConverterObjectName()
        .then(objectName => this.jolokiaService.execute(objectName, 'listTypeConverters')
        .then(object => {
          var typeConverters = [];
          for (let from in object) {
            const tos = object[from];
            for (let to in tos) {
              typeConverters.push(new TypeConverter(from, to));
            }
          }
          return typeConverters;
        }));
    }

    private getTypeConverterObjectName() {
      return this.treeService.findMBeanWithProperties('org.apache.camel', {type: 'services', name: '*TypeConverter'})
        .then(mbean => mbean.objectName);
    }
  }

}
