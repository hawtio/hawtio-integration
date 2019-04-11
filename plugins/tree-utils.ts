namespace HawtioTree {

  export function getMaxTreeLevel(tree: any): number {
    return tree.getNodes()
      .map((node) => node.level)
      .reduce((a: number, b: number) => Math.max(a, b));
  }
}
