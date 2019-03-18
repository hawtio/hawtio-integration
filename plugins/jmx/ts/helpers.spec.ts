/// <reference path="helpers.ts"/>

describe("coreHelpers", () => {

  it("should escape MBean names", () => {
    // given
    let mbeans = ['aaa/bbb/ccc', 'aaa!bbb!ccc', 'aaa"bbb"ccc', 'a/b!c"d'];
    let escaped = ['aaa!/bbb!/ccc', 'aaa!!bbb!!ccc', 'aaa!%22bbb!%22ccc', 'a!/b!!c!%22d'];
    // when
    let results = mbeans.map(mbean => Core.escapeMBean(mbean));
    // then
    _.zip(results, escaped).forEach(
      ([result, expected]) => expect(result).toBe(expected));
  });

  it("should escape MBean paths", () => {
    // given
    let mbeans = ['java.lang:type=Memory'];
    let escaped = ['java.lang/type=Memory'];
    // when
    let results = mbeans.map(mbean => Core.escapeMBeanPath(mbean));
    // then
    _.zip(results, escaped).forEach(
      ([result, expected]) => expect(result).toBe(expected));
  });

});
