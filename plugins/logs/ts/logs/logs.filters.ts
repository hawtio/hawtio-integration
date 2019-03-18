namespace Logs {
  
  export function logDateFilter($filter) {
    'ngInject';
    
    var standardDateFilter = $filter('date');
    return function (log) {
      if (!log) {
        return null;
      }
      // if there is a seq in the reply, then its the timestamp with milli seconds
      if (log.seq) {
        return standardDateFilter(log.seq, 'yyyy-MM-dd HH:mm:ss.sss')
      } else {
        return standardDateFilter(log.timestamp, 'yyyy-MM-dd HH:mm:ss')
      }
    }
  }

  /**
   * @param text {string} haystack to search through
   * @param search {string} needle to search for
   * @param [caseSensitive] {boolean} optional boolean to use case-sensitive searching
   */
  export function highlight() {
    return function (text: string, searches: string[], caseSensitive: boolean) {
      searches.forEach(search => {
        text = text.toString();
        search = search.toString();
        if (caseSensitive) {
          text = text.split(search).join('<mark>' + search + '</mark>');
        } else {
          text = text.replace(new RegExp(search, 'gi'), '<mark>$&</mark>');
        }
      });
      return text;
    };
  }

}
