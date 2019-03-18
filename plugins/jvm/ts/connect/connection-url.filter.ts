namespace JVM {

  export function ConnectionUrlFilter() {
    return function(connection: ConnectOptions) {
      let url = `${connection.scheme}://${connection.host}`;
      if (connection.port) {
        url += `:${connection.port}`;
      }
      if (connection.path) {
        url += `/${connection.path}`;
      }
      return url;
    }
  }

}
