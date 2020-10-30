/// <reference path="../quartz.controller.ts"/>

namespace Quartz {

  export class JobsController extends QuartzController {

    protected onJobsUpdated(): void {
      this.applyFilters(this.toolbarConfig.filterConfig.appliedFilters);
    }

    filteredJobs: Job[] = [];

    private readonly filterFields = [
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
        id: 'durability',
        title: 'Durable',
        placeholder: 'Filter by Durable...',
        filterType: 'select',
        filterValues: ['true', 'false']
      },
      {
        id: 'shouldRecover',
        title: 'Recover',
        placeholder: 'Filter by Recover...',
        filterType: 'select',
        filterValues: ['true', 'false']
      },
      {
        id: 'jobClass',
        title: 'Job ClassName',
        placeholder: 'Filter by Job ClassName...',
        filterType: 'text'
      },
      {
        id: 'description',
        title: 'Description',
        placeholder: 'Filter by Description...',
        filterType: 'text'
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
      let filtered = this.jobs;

      filters.forEach(filter => {
        switch (filter.id) {
          case 'group':
          case 'name':
          case 'jobClass':
          case 'description':
            const regex = new RegExp(filter.value, 'i');
            filtered = filtered.filter(job => job[filter.id].match(regex) !== null);
            break;
          case 'durability':
          case 'shouldRecover':
            filtered = filtered.filter(job => job[filter.id].toString() === filter.value);
            break;
          default:
            log.warn('Unknown filter:', filter);
        }
      });
      log.debug('Filtered jobs:', filtered);

      this.filteredJobs = filtered;
      this.toolbarConfig.filterConfig.resultsCount = this.filteredJobs.length;
      this.toolbarConfig.filterConfig.totalCount = this.jobs.length;
    }

    readonly toolbarConfig = {
      filterConfig: this.filterConfig,
      isTableView: true
    };

    readonly tableConfig = {
      selectionMatchProp: 'name',
      showCheckboxes: false
    };

    readonly tableColumns = [
      { header: 'Group', itemField: 'group' },
      { header: 'Name', itemField: 'name' },
      { header: 'Durable', itemField: 'durability' },
      { header: 'Recover', itemField: 'shouldRecover' },
      { header: 'Job ClassName', itemField: 'jobClass' },
      { header: 'Description', itemField: 'description' }
    ];

    showJobDetails: boolean = false;
    jobDetailsTitle: string = null;
    readonly jobDetailsTemplate = 'plugins/quartz/jobs/jobs-details-dialog.html';
    jobDetailsScope: {
      dataMap: { [key: string]: string },
      keys: string[]
    } = null;
    readonly jobDetailsButtons = [
      { label: "Close" }
    ];

    onClick(job: Job): void {
      log.debug('Selected job:', job);
      this.jobDetailsTitle = `Job DataMap details of ${job.group}/${job.name}`;
      this.jobDetailsScope = {
        dataMap: job.jobDataMap,
        keys: Object.keys(job.jobDataMap).sort()
      }
      this.showJobDetails = true;
    }

    onClose(): void {
      this.jobDetailsScope = null;
      this.showJobDetails = false;
    }
  }

  export const jobsComponent: angular.IComponentOptions = {
    templateUrl: 'plugins/quartz/jobs/jobs.html',
    controller: JobsController
  };

}
