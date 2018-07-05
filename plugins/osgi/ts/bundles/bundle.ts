namespace Osgi {

    export interface Bundle {
      id: number,
      name: string,
      location: string,
      symbolicName: string,
      state: string,
      version: string,
      startLevel: number,
      fragment: boolean
    }

  }
