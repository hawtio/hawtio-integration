// TODO: should be move to Jmx
namespace Core {

  export function scopeStoreJolokiaHandle($scope, jolokia, jolokiaHandle) {
    // TODO do we even need to store the jolokiaHandle in the scope?
    if (jolokiaHandle) {
      $scope.$on('$destroy', function () {
        closeHandle($scope, jolokia)
      });
      $scope.jolokiaHandle = jolokiaHandle;
    }
  }

  export function closeHandle($scope, jolokia) {
    let jolokiaHandle = $scope.jolokiaHandle
    if (jolokiaHandle) {
      //console.log('Closing the handle ' + jolokiaHandle);
      jolokia.unregister(jolokiaHandle);
      $scope.jolokiaHandle = null;
    }
  }

  /**
   * Pass in null for the success function to switch to sync mode
   *
   * @method onSuccess
   * @static
   * @param {Function} Success callback function
   * @param {Object} Options object to pass on to Jolokia request
   * @return {Object} initialized options object
   */
  export function onSuccess(
    fn: (response: Jolokia.IResponse) => void | ((response: Jolokia.IResponse) => void)[],
    options: Jolokia.IParams = {}): any {
    options['mimeType'] = 'application/json';
    if (!_.isUndefined(fn)) {
      options['success'] = fn;
    }
    if (!options['method']) {
      options['method'] = "POST";
    }
    // the default (unsorted) order is important for Karaf runtime
    options['canonicalNaming'] = false;
    options['canonicalProperties'] = false;
    if (!options['error']) {
      options['error'] = (response: Jolokia.IErrorResponse) => defaultJolokiaErrorHandler(response, options);
    }
    return options;
  }

  /**
   * The default error handler which logs errors either using debug or log level logging based on the silent setting
   * @param response the response from a jolokia request
   */
  export function defaultJolokiaErrorHandler(response: Jolokia.IErrorResponse, options: Jolokia.IParams = {}): void {
    let operation = Core.pathGet(response, ['request', 'operation']) || "unknown";
    let silent = options['silent'];
    let stacktrace = response.stacktrace;
    if (silent || isIgnorableException(response)) {
      log.debug("Operation", operation, "failed due to:", response['error']);
    } else {
      log.warn("Operation", operation, "failed due to:", response['error']);
    }
  }

  /**
   * Checks if it's an error that can happen on timing issues such as its been removed or if we run against older containers
   * @param {Object} response the error response from a jolokia request
   */
  function isIgnorableException(response: Jolokia.IErrorResponse): boolean {
    let isNotFound = (target) =>
      target.indexOf("InstanceNotFoundException") >= 0
      || target.indexOf("AttributeNotFoundException") >= 0
      || target.indexOf("IllegalArgumentException: No operation") >= 0;
    return (response.stacktrace && isNotFound(response.stacktrace)) || (response.error && isNotFound(response.error));
  }

  /**
   * Logs any failed operation and stack traces
   */
  export function logJolokiaStackTrace(response: Jolokia.IErrorResponse) {
    let stacktrace = response.stacktrace;
    if (stacktrace) {
      let operation = Core.pathGet(response, ['request', 'operation']) || "unknown";
      log.info("Operation", operation, "failed due to:", response['error']);
    }
  }


  /**
   * Applies the Jolokia escaping rules to the mbean name.
   * See: http://www.jolokia.org/reference/html/protocol.html#escape-rules
   *
   * @param {string} mbean the mbean
   * @returns {string}
   */
  function applyJolokiaEscapeRules(mbean: string): string {
    return mbean
      .replace(/!/g, '!!')
      .replace(/\//g, '!/')
      .replace(/"/g, '!"');
  }

  /**
   * Escapes the mbean for Jolokia GET requests.
   *
   * @param {string} mbean the mbean
   * @returns {string}
   */
  export function escapeMBean(mbean: string): string {
    return encodeURI(applyJolokiaEscapeRules(mbean));
  }

  /**
   * Escapes the mbean as a path for Jolokia POST "list" requests.
   * See: https://jolokia.org/reference/html/protocol.html#list
   *
   * @param {string} mbean the mbean
   * @returns {string}
   */
  export function escapeMBeanPath(mbean: string): string {
    return applyJolokiaEscapeRules(mbean).replace(':', '/');
  }

  export function parseMBean(mbean) {
    let answer: any = {};
    let parts: any = mbean.split(":");
    if (parts.length > 1) {
      answer['domain'] = _.first(parts);
      parts = _.without(parts, _.first(parts));
      parts = parts.join(":");
      answer['attributes'] = {};
      let nameValues = parts.split(",");
      nameValues.forEach((str) => {
        let nameValue = str.split('=');
        let name = (<string>_.first(nameValue)).trim();
        nameValue = _.without(nameValue, _.first(nameValue));
        answer['attributes'][name] = nameValue.join('=').trim();
      });
    }
    return answer;
  }


  /**
   * Register a JMX operation to poll for changes, only
   * calls back when a change occurs
   *
   * @param jolokia
   * @param scope
   * @param arguments
   * @param callback
   * @param options
   * @returns Object
   */
  export function registerForChanges(jolokia, $scope, arguments, callback: (response: any) => void, options?: any): () => void {
    let decorated = {
      responseJson: '',
      success: (response) => {
        let json = angular.toJson(response.value);
        if (decorated.responseJson !== json) {
          decorated.responseJson = json;
          callback(response);
        }
      }
    };
    angular.extend(decorated, options);
    return Core.register(jolokia, $scope, arguments, onSuccess(undefined, decorated));
  }

  // Jolokia caching stuff, try and cache responses so we don't always have to wait
  // for the server

  export interface IResponseHistory {
    [name: string]: any;
  }

  let responseHistory: IResponseHistory = null;

  export function getOrInitObjectFromLocalStorage(key: string): any {
    let answer: any = undefined;
    if (!(key in localStorage)) {
      localStorage[key] = angular.toJson({});
    }
    return angular.fromJson(localStorage[key]);
  }

  function argumentsToString(arguments: Array<any>) {
    return StringHelpers.toString(arguments);
  }

  function keyForArgument(argument: any) {
    if (!('type' in argument)) {
      return null;
    }
    let answer = <string>argument['type'];
    switch (answer.toLowerCase()) {
      case 'exec':
        answer += ':' + argument['mbean'] + ':' + argument['operation'];
        let argString = argumentsToString(argument['arguments']);
        if (!Core.isBlank(argString)) {
          answer += ':' + argString;
        }
        break;
      case 'read':
        answer += ':' + argument['mbean'] + ':' + argument['attribute'];
        break;
      default:
        return null;
    }
    return answer;
  }

  function createResponseKey(arguments: any) {
    let answer = '';
    if (angular.isArray(arguments)) {
      answer = arguments.map((arg) => { return keyForArgument(arg); }).join(':');
    } else {
      answer = keyForArgument(arguments);
    }
    return answer;
  }

  export function getResponseHistory(): any {
    if (responseHistory === null) {
      //responseHistory = getOrInitObjectFromLocalStorage('responseHistory');
      responseHistory = {};
      log.debug("Created response history", responseHistory);
    }
    return responseHistory;
  }

  export const MAX_RESPONSE_CACHE_SIZE = 20;

  function getOldestKey(responseHistory: IResponseHistory) {
    let oldest: number = null;
    let oldestKey: string = null;
    angular.forEach(responseHistory, (value: any, key: string) => {
      //log.debug("Checking entry: ", key);
      //log.debug("Oldest timestamp: ", oldest, " key: ", key, " value: ", value);
      if (!value || !value.timestamp) {
        // null value is an excellent candidate for deletion
        oldest = 0;
        oldestKey = key;
      } else if (oldest === null || value.timestamp < oldest) {
        oldest = value.timestamp;
        oldestKey = key;
      }
    });
    return oldestKey;
  }

  function addResponse(arguments: any, value: any) {
    let responseHistory = getResponseHistory();
    let key = createResponseKey(arguments);
    if (key === null) {
      log.debug("key for arguments is null, not caching: ", StringHelpers.toString(arguments));
      return;
    }
    //log.debug("Adding response to history, key: ", key, " value: ", value);
    // trim the cache if needed
    let keys = _.keys(responseHistory);
    //log.debug("Number of stored responses: ", keys.length);
    if (keys.length >= MAX_RESPONSE_CACHE_SIZE) {
      log.debug("Cache limit (", MAX_RESPONSE_CACHE_SIZE, ") met or  exceeded (", keys.length, "), trimming oldest response");
      let oldestKey = getOldestKey(responseHistory);
      if (oldestKey !== null) {
        // delete the oldest entry
        log.debug("Deleting key: ", oldestKey);
        delete responseHistory[oldestKey];
      } else {
        log.debug("Got null key, could be a cache problem, wiping cache");
        keys.forEach((key) => {
          log.debug("Deleting key: ", key);
          delete responseHistory[key];
        });
      }
    }

    responseHistory[key] = value;
    //localStorage['responseHistory'] = angular.toJson(responseHistory);
  }

  function getResponse(jolokia, arguments: any, callback: any) {
    let responseHistory = getResponseHistory();
    let key = createResponseKey(arguments);
    if (key === null) {
      jolokia.request(arguments, callback);
      return;
    }
    if (key in responseHistory && 'success' in callback) {
      let value = responseHistory[key];
      // do this async, the controller might not handle us immediately calling back
      setTimeout(() => {
        callback['success'](value);
      }, 10);
    } else {
      log.debug("Unable to find existing response for key: ", key);
      jolokia.request(arguments, callback);
    }
  }
  // end jolokia caching stuff


  /**
   * Register a JMX operation to poll for changes
   * @method register
   * @for Core
   * @static
   * @return {Function} a zero argument function for unregistering  this registration
   * @param {*} jolokia
   * @param {*} scope
   * @param {Object} arguments
   * @param {Function} callback
   */
  export function register(jolokia: Jolokia.IJolokia, scope, arguments: any, callback) {
    if (scope.$$destroyed) {
      // fail fast to prevent registration leaks
      return;
    }
    /*
    if (scope && !Core.isBlank(scope.name)) {
      Core.log.debug("Calling register from scope: ", scope.name);
    } else {
      Core.log.debug("Calling register from anonymous scope");
    }
    */
    if (!angular.isDefined(scope.$jhandle) || !angular.isArray(scope.$jhandle)) {
      //log.debug("No existing handle set, creating one");
      scope.$jhandle = [];
    } else {
      //log.debug("Using existing handle set");
    }
    if (angular.isDefined(scope.$on)) {
      scope.$on('$destroy', function (event) {
        unregister(jolokia, scope);
      });
    }

    let handle: number = null;

    if ('success' in callback) {
      let cb = callback.success;
      let args = arguments;
      callback.success = (response) => {
        addResponse(args, response);
        cb(response);
      }
    }

    if (angular.isArray(arguments)) {
      if (arguments.length >= 1) {
        // TODO can't get this to compile in typescript :)
        //let args = [callback].concat(arguments);
        let args = <any>[callback];
        angular.forEach(arguments, (value) => args.push(value));
        //let args = [callback];
        //args.push(arguments);
        let registerFn = jolokia.register;
        handle = registerFn.apply(jolokia, args);
        scope.$jhandle.push(handle);
        getResponse(jolokia, arguments, callback);
      }
    } else {
      handle = jolokia.register(callback, arguments);
      scope.$jhandle.push(handle);
      getResponse(jolokia, arguments, callback);
    }
    return () => {
      if (handle !== null) {
        scope.$jhandle.remove(handle);
        jolokia.unregister(handle);
      }
    };
  }

  /**
   * Register a JMX operation to poll for changes using a jolokia search using the given mbean pattern
   * @method registerSearch
   * @for Core
   * @static
   * @paran {*} jolokia
   * @param {*} scope
   * @param {String} mbeanPattern
   * @param {Function} callback
   */
  /*
  TODO - won't compile, and where is 'arguments' coming from?
  export function registerSearch(jolokia:Jolokia.IJolokia, scope, mbeanPattern:string, callback) {
      if (!angular.isDefined(scope.$jhandle) || !angular.isArray(scope.$jhandle)) {
          scope.$jhandle = [];
      }
      if (angular.isDefined(scope.$on)) {
          scope.$on('$destroy', function (event) {
              unregister(jolokia, scope);
          });
      }
      if (angular.isArray(arguments)) {
          if (arguments.length >= 1) {
              // TODO can't get this to compile in typescript :)
              //let args = [callback].concat(arguments);
              let args = [callback];
              angular.forEach(arguments, (value) => args.push(value));
              //let args = [callback];
              //args.push(arguments);
              let registerFn = jolokia.register;
              let handle = registerFn.apply(jolokia, args);
              scope.$jhandle.push(handle);
              jolokia.search(mbeanPattern, callback);
          }
      } else {
          let handle = jolokia.register(callback, arguments);
          scope.$jhandle.push(handle);
          jolokia.search(mbeanPattern, callback);
      }
  }
  */

  export function unregister(jolokia: Jolokia.IJolokia, scope) {
    if (angular.isDefined(scope.$jhandle)) {
      scope.$jhandle.forEach(function (handle) {
        jolokia.unregister(handle);
      });
      delete scope.$jhandle;
    }
  }
}
