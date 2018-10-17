namespace Camel {

  export interface RestService {
    url: string;
    method: string;
    consumes: string;
    produces: string;
    routeId: string;
  }

}
