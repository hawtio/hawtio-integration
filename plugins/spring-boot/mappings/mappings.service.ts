/// <reference path="mapping.ts"/>

namespace SpringBoot {

  export class MappingsService {

    constructor(private jolokiaService: JVM.JolokiaService) {
      'ngInject';
    }

    getMappings(): ng.IPromise<Mapping[]> {
      return this.jolokiaService.getAttribute('org.springframework.boot:type=Endpoint,name=requestMappingEndpoint', 'Data')
        .then(data => {
          let mappings: Mapping[] = [];

          angular.forEach(data, (beanInfo, mappingAttributes) => {
            mappings.push(this.toMapping(beanInfo, mappingAttributes))
          });

          return mappings;
        });
    }

    private toMapping(beanInfo: any, mappingAttributes: string): Mapping {
      let mapping = new Mapping();
      mapping.bean = beanInfo.bean;
      mapping.beanMethod = beanInfo.method;
      mapping.methods = "*";

      angular.forEach(mappingAttributes.split(","), (attributes) => {
        let mappingAttribute = this.santizeAttributes(attributes);

        if (this.isPath(mappingAttribute)) {
          mapping.paths = mappingAttribute;
        } else if(this.isProperty(mappingAttribute)) {
          let props = mappingAttribute.split(/=(.+)/);
          let key = props[0]
          let value = props[1]

          switch(key) {
            case 'consumes': {
              mapping.consumes = value;
              break;
            }
            case 'headers': {
              mapping.headers = value;
              break;
            }
            case 'methods': {
              mapping.methods = value;
              break;
            }
            case 'params': {
              mapping.params = value;
              break;
            }
            case 'produces': {
              mapping.produces = value;
              break;
            }
            default: {
              log.debug('Encountered unknown Spring Boot Actuator property:', key)
              break;
            }
          }
        } else {
          // This is some unknown property value
          log.debug('Encountered unparsable Spring Boot Actuator data: ', mappingAttribute)
        }
      });
      return mapping;
    }

    private santizeAttributes(attribute: string): string {
      let sanitized = attribute.replace(/(^{\[|\]}$|\[|\])/gm, '')
      sanitized = sanitized.replace(/(&&|\|\|)/g, ',');
      sanitized = sanitized.replace(/\s/g, '');
      return sanitized;
    }

    private isPath(pathCandidate: string): boolean {
      return /^\/.*/.test(pathCandidate);
    }

    private isProperty(propertyCandidate: string): boolean {
      return /.*\=.*/.test(propertyCandidate);
    }
  }
}
