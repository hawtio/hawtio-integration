/// <reference path="type-converter.ts"/>

namespace Camel {

  export class TypeCovertersTableController {
    allTypeConverters: TypeConverter[];
    typeConverters: TypeConverter[];

    toolbarConfig = {
      filterConfig: {
        fields: [
          {
            id: 'from',
            title: 'From',
            placeholder: 'Filter by from...',
            filterType: 'text'
          },
          {
            id: 'to',
            title: 'To',
            placeholder: 'Filter by to...',
            filterType: 'text'
          }
        ],
        onFilterChange: (filters: any[]) => {
          this.applyFilters(filters);
        },
        resultsCount: 0
      },
      isTableView: true
    };

    tableConfig = {
      selectionMatchProp: 'from',
      showCheckboxes: false
    };

    tableDtOptions = {
      order: [[0, "asc"], [1, "asc"]],
    };

    tableColumns = [
      { header: 'From', itemField: 'from' },
      { header: 'To', itemField: 'to' }
    ];

    constructor(private typeConvertersService: TypeConvertersService) {
      'ngInject';
    }
    
    $onInit() {
      this.typeConvertersService.getTypeConverters()
        .then(typeConverters => {
          this.allTypeConverters = typeConverters;
          this.applyFilters([]);
        });
    }

    applyFilters(filters: any[]) {
      this.typeConverters = this.allTypeConverters;
      filters.forEach(filter => {
        var regExp = new RegExp(filter.value, 'i');
        switch (filter.id) {
          case 'from':
            this.typeConverters = this.typeConverters.filter(typeConverter => regExp.test(typeConverter.from));
            break;
          case 'to':
            this.typeConverters = this.typeConverters.filter(typeConverter => regExp.test(typeConverter.to));
            break;
        }
      });
      this.toolbarConfig.filterConfig.resultsCount = this.typeConverters.length;
    }    
  }
  
  export const typeConvertersTableComponent: angular.IComponentOptions = {
    template: `
      <div class="table-view">
        <pf-toolbar config="$ctrl.toolbarConfig"></pf-toolbar>
        <pf-table-view config="$ctrl.tableConfig"
                       dt-options="$ctrl.tableDtOptions"
                       columns="$ctrl.tableColumns"
                       items="$ctrl.typeConverters"></pf-table-view>
      </div>
    `,
    controller: TypeCovertersTableController
  };

}
