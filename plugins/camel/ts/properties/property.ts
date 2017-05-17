namespace Camel {

  export class Property {
   
    constructor(public name: string, public value: string, public description: string) {
    }
    
    static sortByName(a, b) {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    }
  }

}
