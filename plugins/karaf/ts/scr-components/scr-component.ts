namespace Karaf {
  
    export interface ScrComponent {
      id: number,
      bundleId: number,
      name: string,
      state: string,
      properties: any,
      references: any
    }
  }
