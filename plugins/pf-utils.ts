namespace Pf {

  export function filter<T>(items: T[], filterConfig: any): T[] {
    let filteredItems = items;
    if (filterConfig.appliedFilters) {
      filterConfig.appliedFilters.forEach(filter => {
        const filterType = _.find(filterConfig.fields, { 'id': filter.id }).filterType;
        switch (filterType) {
          case 'text':
            const regExp = new RegExp(filter.value, 'i');
            filteredItems = filteredItems.filter(item => regExp.test(item[filter.id]));
            break;
          case 'number':
            filteredItems = filteredItems.filter(item => item[filter.id] === parseInt(filter.value));
            break;
          case 'select':
            filteredItems = filteredItems.filter(item => item[filter.id] === filter.value);
            break;
        }
      });
    }
    filterConfig.resultsCount = filteredItems.length;
    return filteredItems;
  }

}
