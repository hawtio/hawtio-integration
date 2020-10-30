
/// <reference path="../quartz.controller.ts"/>

namespace Quartz {

  export class TriggerController extends QuartzController {

    $onInit(): void {
      super.$onInit();
      this.configureActions();
    }

    protected clear(): void {
      super.clear();
      this.updateTriggerForm = null;
      this.manualTriggerForm = null;
    }

    protected onTriggersUpdated(): void {
      this.applyFilters(this.toolbarConfig.filterConfig.appliedFilters);
    }

    filteredTriggers: Trigger[] = [];

    private readonly filterFields = [
      {
        id: 'state',
        title: 'State',
        placeholder: 'Filter by State...',
        filterType: 'select',
        filterValues: ['NORMAL', 'PAUSED']
      },
      {
        id: 'group',
        title: 'Group',
        placeholder: 'Filter by Group...',
        filterType: 'text'
      },
      {
        id: 'name',
        title: 'Name',
        placeholder: 'Filter by Name...',
        filterType: 'text'
      },
      {
        id: 'type',
        title: 'Type',
        placeholder: 'Filter by Type...',
        filterType: 'select',
        filterValues: ['cron', 'simple']
      }
    ];

    private readonly filterConfig = {
      fields: this.filterFields,
      resultsCount: 0,
      totalCount: 0,
      appliedFilters: [],
      onFilterChange: (filters: Filter[]) => this.applyFilters(filters)
    };

    private applyFilters(filters: Filter[]): void {
      log.debug('Applying filters:', filters);
      let filtered = this.triggers;

      filters.forEach(filter => {
        switch (filter.id) {
          case 'state':
            filtered = filtered.filter(t => t.state === filter.value);
            break;
          case 'group':
          case 'name':
            const regex = new RegExp(filter.value, 'i');
            filtered = filtered.filter(t => t[filter.id].match(regex) !== null);
            break;
          case 'type':
            filtered = filtered.filter(t => t.type === filter.value);
            break;
          default:
            log.warn('Unknown filter:', filter);
        }
      });
      log.debug('Filtered triggers:', filtered);

      this.filteredTriggers = filtered;
      this.toolbarConfig.filterConfig.resultsCount = this.filteredTriggers.length;
      this.toolbarConfig.filterConfig.totalCount = this.triggers.length;
    }

    readonly toolbarConfig = {
      filterConfig: this.filterConfig,
      actionsConfig: {},
      isTableView: true
    };

    readonly tableConfig = {
      selectionMatchProp: 'name',
      showCheckboxes: false
    };

    readonly tableColumns = [
      {
        header: 'State', itemField: 'state',
        templateFn: (value: string) => `
          <div class="centered">
            <span class="${iconClass(value)}"></span>
          </div>
        `
      },
      { header: 'Group', itemField: 'group' },
      { header: 'Name', itemField: 'name' },
      { header: 'Type', itemField: 'type' },
      { header: 'Expression', itemField: 'expression' },
      {
        header: 'Misfire Instruction', itemField: 'misfireInstruction',
        templateFn: (value: number) => misfireText(value)
      },
      { header: 'Previous Fire', itemField: 'previousFireTime' },
      { header: 'Next Fire', itemField: 'nextFireTime' },
      { header: 'Final Fire', itemField: 'finalFireTime' }
    ];

    private readonly resumePauseAction = {
      name: 'Resume/Pause',
      actionFn: (_action, item: Trigger) => {
        switch (item.state) {
          case 'NORMAL':
            this.pauseTrigger(item);
            break;
          case 'PAUSED':
            this.resumeTrigger(item);
            break;
          default:
            log.warn('Unknown trigger state:', item.state);
        }
      }
    };

    private readonly updateAction = {
      name: 'Update Trigger',
      actionFn: (_action, item: Trigger) => this.beforeUpdateTrigger(item)
    };

    private readonly manualTriggerAction = {
      name: 'Manually Trigger',
      actionFn: (_action, item: Trigger) => this.beforeManualTrigger(item)
    };

    actionButtons = [];

    menuActions = [];

    private configureActions(): void {
      if (this.quartzService.canResumeTrigger(this.selectedSchedulerMBean)
        || this.quartzService.canPauseTrigger(this.selectedSchedulerMBean)) {
        this.actionButtons.push(this.resumePauseAction);
      }
      if (this.quartzService.canUpdateTrigger(this.selectedSchedulerMBean)) {
        this.menuActions.push(this.updateAction);
      }
      if (this.quartzService.canManualTrigger(this.selectedSchedulerMBean)) {
        this.menuActions.push(this.manualTriggerAction);
      }
      log.debug('RBAC - Rendered triggers actions:', this.actionButtons.concat(this.menuActions).map(a => a.name));
    }

    pauseTrigger(trigger: Trigger): void {
      const groupName = trigger.group;
      const triggerName = trigger.name;
      const fullName = groupName + "/" + triggerName;
      this.quartzService.pauseTrigger(this.selectedSchedulerMBean, [triggerName, groupName],
        () => Core.notification("success", `Paused trigger ${fullName}`)
      );
    }

    resumeTrigger(trigger: Trigger): void {
      const groupName = trigger.group;
      const triggerName = trigger.name;
      const fullName = groupName + "/" + triggerName;
      this.quartzService.resumeTrigger(this.selectedSchedulerMBean, [triggerName, groupName],
        () => Core.notification("success", `Resumed trigger ${fullName}`)
      );
    }

    showUpdateTriggerDialog: boolean = false;
    updateTriggerTitle: string = null;
    readonly updateTriggerTemplate = 'plugins/quartz/triggers/triggers-update-dialog.html';
    updateTriggerForm: UpdateTriggerForm = null;
    readonly updateTriggerButtons = [
      { label: "Cancel", isCancel: true },
      {
        label: "Update", class: "btn-primary", actionFn: () => this.onUpdateTrigger()
      }
    ];
    private readonly misfireInstructions = [
      { id: '-1', title: 'Ignore' },
      { id: '0', title: 'Smart' },
      { id: '1', title: 'Fire once now' },
      { id: '2', title: 'Do nothing' }
    ];

    beforeUpdateTrigger(trigger: Trigger): void {
      this.updateTriggerTitle = `Update trigger: ${trigger.group}/${trigger.name}`;
      switch (trigger.type) {
        case 'cron':
          this.updateTriggerForm = {
            group: trigger.group,
            name: trigger.name,
            type: 'cron',
            cron: trigger.expression,
            repeatCount: null,
            repeatInterval: null,
            // must be a string type for the select-box to select it
            misfireInstruction: '' + trigger.misfireInstruction,
            // form visibilities
            showCron: true,
            showRepeatCount: false,
            showRepeatInterval: false,
            misfireInstructions: this.misfireInstructions
          };
          this.showUpdateTriggerDialog = true;
          break;
        case 'simple':
          this.updateTriggerForm = {
            group: trigger.group,
            name: trigger.name,
            type: 'simple',
            cron: null,
            repeatCount: trigger.repeatCount,
            repeatInterval: trigger.repeatInterval,
            // must be a string type for the select-box to select it
            misfireInstruction: '' + trigger.misfireInstruction,
            // form visibilities
            showCron: false,
            showRepeatCount: true,
            showRepeatInterval: true,
            misfireInstructions: this.misfireInstructions
          };
          this.showUpdateTriggerDialog = true;
          break;
        default:
          this.updateTriggerForm = null;
          this.showUpdateTriggerDialog = false;
      }
    }

    onUpdateTrigger(): void {
      const groupName = this.updateTriggerForm.group;
      const triggerName = this.updateTriggerForm.name;
      const cron = this.updateTriggerForm.cron;
      const misfireInstruction = parseInt(this.updateTriggerForm.misfireInstruction);
      let repeatCount = this.updateTriggerForm.repeatCount;
      let repeatInterval = this.updateTriggerForm.repeatInterval;
      this.updateTriggerForm = null;

      const fullName = groupName + "/" + triggerName;

      // cron
      if (cron) {
        log.info("Updating trigger:", fullName, "cron =", cron, "misfireInstruction =", misfireInstruction);
        this.quartzService.updateCronTrigger(
          [
            this.selectedSchedulerMBean,
            triggerName,
            groupName,
            misfireInstruction,
            cron,
            null
          ],
          () => {
            Core.notification("success", "Updated trigger " + fullName);
            this.updateSelectedScheduler();
          },
          (response: Jolokia.IErrorResponse) => Core.notification("danger",
            `Could not update trigger ${fullName} due to: ${response.error}`)
        );
        return;
      }

      // simple
      if (repeatCount || repeatInterval) {
        if (repeatCount == null) {
          repeatCount = -1;
        }
        if (repeatInterval == null) {
          repeatInterval = 1000;
        }

        log.info("Updating trigger:", fullName, "with interval", repeatInterval, "ms. for", repeatCount, "times");
        this.quartzService.updateSimpleTrigger(
          [
            this.selectedSchedulerMBean,
            triggerName,
            groupName,
            misfireInstruction,
            repeatCount,
            repeatInterval
          ],
          () => {
            Core.notification("success", "Updated trigger " + fullName);
            this.updateSelectedScheduler();
          },
          (response: Jolokia.IErrorResponse) => Core.notification("danger",
            `Could not update trigger ${fullName} due to: ${response.error}`)
        );
      }
    }

    showManualTriggerDialog: boolean = false;
    readonly manualTriggerTitle = 'Manually fire trigger';
    readonly manualTriggerTemplate = 'plugins/quartz/triggers/triggers-manual-dialog.html';
    manualTriggerForm: ManualTriggerForm = null;
    readonly manualTriggerButtons = [
      { label: "Cancel", isCancel: true },
      {
        label: "Fire now", class: "btn-danger", actionFn: () => this.onManualTrigger()
      }
    ];

    beforeManualTrigger(trigger: Trigger): void {
      this.manualTriggerForm = {
        name: trigger.jobName,
        group: trigger.jobGroup,
        parameters: '{}'
      }
      this.showManualTriggerDialog = true;
    }

    onManualTrigger(): void {
      const triggerName = this.manualTriggerForm.name;
      const groupName = this.manualTriggerForm.group;
      const parameters = JSON.parse(this.manualTriggerForm.parameters);
      const fullName = groupName + "/" + triggerName;
      this.manualTriggerForm = null;

      log.info("Mannually firing trigger", fullName, "with parameters", parameters);

      this.quartzService.triggerJob(this.selectedSchedulerMBean,
        [
          triggerName,
          groupName,
          parameters
        ],
        () => Core.notification("success", `Manually fired trigger ${fullName}`),
        (response: Jolokia.IErrorResponse) => Core.notification("danger",
          `Could not manually fire trigger ${fullName} due to: ${response.error}`)
      );
    }

    onClose(): void {
      this.showUpdateTriggerDialog = false;
      this.showManualTriggerDialog = false;
    }
  }

  export const triggersComponent: angular.IComponentOptions = {
    templateUrl: 'plugins/quartz/triggers/triggers.html',
    controller: TriggerController
  };

}
