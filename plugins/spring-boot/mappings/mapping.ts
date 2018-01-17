namespace SpringBoot {

  export class Mapping {
    bean: string;
    beanMethod: string;
    consumes: string;
    headers: string;
    methods: string;
    params: string;
    produces: string;
    paths: string;

    getClassMethod(): string {
      let myRegexp = /.*[\.](.*)[\.](.*)[^(]?[(].*[)]/g;
      let match = myRegexp.exec(this.beanMethod);

      if (match && match.length > 0) {
        return match[1] + "." + match[2];
      }
      return "";
    }
  }
}
