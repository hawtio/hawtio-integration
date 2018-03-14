namespace Camel {

  export const exchangesComponent: angular.IComponentOptions = {
    template: `
      <h2>Exchanges</h2>
      <inflight-exchanges></inflight-exchanges>
      <blocked-exchanges></blocked-exchanges>
    `
  };

}
