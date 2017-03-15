/// <reference path="../camelPlugin.ts"/>

module Camel {

  _module.component('propertyList', {
    template: `
      <div ng-show="$ctrl.properties.length > 0">
        <h3>{{$ctrl.title}}</h3>
        <dl class="dl-horizontal">
          <dt ng-repeat-start="property in $ctrl.properties">
            {{property.name}}
            <span class="fa fa-info-circle camel-properties-info-circle" data-toggle="tooltip" data-placement="right" title="{{property.description}}"></span>
          </dt>
          <dd ng-repeat-end>
            <samp>{{property.value}}</samp>
          </dd>
        </dl>
      </div>`,
    bindings: {
      title: '@',
      properties: '<'
    }
  });

}
