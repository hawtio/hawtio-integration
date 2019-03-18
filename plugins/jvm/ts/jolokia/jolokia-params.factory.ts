namespace JVM {

  export function createJolokiaParams(jolokiaUrl: string, localStorage: Storage): Jolokia.IParams {
    'ngInject';

    let answer: Jolokia.IParams = {
      canonicalNaming: false,
      ignoreErrors: true,
      maxCollectionSize: DEFAULT_MAX_COLLECTION_SIZE,
      maxDepth: DEFAULT_MAX_DEPTH,
      method: 'post',
      mimeType: 'application/json'
    };
    
    if ('jolokiaParams' in localStorage) {
      answer = angular.fromJson(localStorage['jolokiaParams']);
    } else {
      localStorage['jolokiaParams'] = angular.toJson(answer);
    }
    
    answer['url'] = jolokiaUrl;
    
    return answer;
  }

}
