namespace SpringBoot {

  type Item = { key: string; value: any; };

  export class Info {
    items: Item[];

    constructor(obj: any) {
      const items = this.flatten(obj);
      items.sort((a, b) => {
        if (a.key > b.key) return 1;
        if (a.key < b.key) return -1;
        return 0;
      });
      this.items = items;
    }

    private flatten(obj: any): Item[] {
      return Object.entries(obj)
        // flatMap shim
        .reduce((acc, [key, value]) => {
          if (typeof value === 'object') {
            const items = this.flatten(value).map(item => this.prefixKey(key, item));
            acc.push(...items);
          } else {
            acc.push({ key, value });
          }
          return acc;
        }, []);
    }

    private prefixKey(prefix: string, item: Item): Item {
      return { key: `${prefix}.${item.key}`, value: item.value };
    }
  }

}
