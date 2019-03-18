/// <reference path="./diagnostics.service.ts"/>

namespace Diagnostics {

  export interface ClassStats {
    count: string;
    bytes: string;
    name: string;
    deltaCount: string;
    deltaBytes: string;
  }

  export interface HeapControllerScope extends ng.IScope {
    items: Array<ClassStats>;
    loading: boolean;
    lastLoaded: any;
    toolbarConfig: any;
    tableConfig: any;
    tableDtOptions: any;
    tableColumns: Array<any>;
    pageConfig: object;
    loadClassStats: () => void;
  }

  export function DiagnosticsHeapController($scope: HeapControllerScope, jolokia: Jolokia.IJolokia,
    diagnosticsService: DiagnosticsService) {
    'ngInject';

    let instanceCounts;
    let byteCounts;

    $scope.items = [];
    $scope.loading = false;
    $scope.lastLoaded = null;

    $scope.toolbarConfig = {
      actionsConfig: {
        actionsInclude: true
      },
      isTableView: true
    };

    $scope.tableConfig = {
      selectionMatchProp: 'name',
      showCheckboxes: false
    };

    $scope.tableDtOptions = {
      order: [[2, "desc"]]
    };

    $scope.pageConfig = {
      pageSize: 20
    };

    $scope.tableColumns = [
      {
        header: 'Class Name',
        itemField: 'name'
      },
      {
        header: 'Bytes',
        itemField: 'bytes'
      },
      {
        header: 'Bytes Delta',
        itemField: 'deltaBytes'
      },
      {
        header: 'Instances',
        itemField: 'count'
      },
      {
        header: 'Instances Delta',
        itemField: 'deltaCount'
      }
    ];

    $scope.loadClassStats = () => {
      $scope.loading = true;
      Core.$apply($scope);
      jolokia.request({
        type: 'exec',
        mbean: 'com.sun.management:type=DiagnosticCommand',
        operation: 'gcClassHistogram([Ljava.lang.String;)',
        arguments: ['']
      }, {
          success: render,
          error: (response) => {
            log.error('Failed to get class histogram: ' + response.error);
            $scope.loading = false;
            Core.$apply($scope);
          }
        });
    };

    function render(response) {
      const classHistogram = response.value;
      const lines = response.value.split('\n');
      const parsed = [];
      const classCounts = {};
      const bytesCounts = {};
      for (let i = 0; i < lines.length; i++) {
        const values = lines[i].match(/\s*(\d+):\s*(\d+)\s*(\d+)\s*(\S+)\s*/);
        if (values && values.length >= 5) {
          const className = translateJniName(values[4]);
          const count = values[2];
          const bytes = values[3];
          const entry = {
            count: count,
            bytes: bytes,
            name: className,
            deltaCount: findDelta(instanceCounts, className, count),
            deltaBytes: findDelta(byteCounts, className, bytes)
          };

          parsed.push(entry);
          classCounts[className] = count;
          bytesCounts[className] = bytes;
        }
      }
      $scope.items = parsed;
      $scope.lastLoaded = Date.now();
      instanceCounts = classCounts;
      byteCounts = bytesCounts;
      Core.$apply($scope);
      setTimeout(() => {
        $scope.loading = false;
        Core.$apply($scope);
      });
    }

    function findDelta(oldCounts, className, newValue) {
      if (!oldCounts) {
        return '';
      }
      const oldValue = oldCounts[className];
      if (oldValue) {
        return oldValue - newValue;
      } else {
        return newValue;
      }
    }

    function translateJniName(name) {
      if (name.length == 1) {
        switch (name.charAt(0)) {
          case 'I':
            return 'int';
          case 'S':
            return 'short';
          case 'C':
            return 'char';
          case 'Z':
            return 'boolean';
          case 'D':
            return 'double';
          case 'F':
            return 'float';
          case 'J':
            return 'long';
          case 'B':
            return 'byte';
        }
      } else {
        switch (name.charAt(0)) {
          case '[':
            return translateJniName(name.substring(1)) + '[]';
          case 'L':
            if (name.endsWith(';')) {
              return translateJniName(name.substring(1, name.indexOf(';')));
            }
          default:
            return name;
        }
      }
    }
  }
}
