# hawtio-integration

[![Test](https://github.com/hawtio/hawtio-integration/actions/workflows/test.yml/badge.svg)](https://github.com/hawtio/hawtio-integration/blob/main/.github/workflows/test.yml)

This project provides ActiveMQ, Camel, Karaf and Spring Boot plugins for hawtio.

## Installation

```
yarn add @hawtio/integration
```

## Set up development environment

### Clone the repository

```
git clone https://github.com/hawtio/hawtio-integration
cd hawtio-integration
```

### Install development tools

* [Node.js](http://nodejs.org)
* [Yarn](https://yarnpkg.com)
* [gulp](http://gulpjs.com/)

### Install project dependencies

```
yarn install
```

## Developing

### Run the web application

```
yarn start
```

### Change the default proxy port

To proxy to a local JVM running on a different port than `8282` specify the `--port` CLI arguement to gulp:
```
yarn start -- --port=8181
```

### Output build to a different directory

When developing this plugin in a dependent console you can change the output directory where the compiled `.js` and `.css` go.  Just use the `--out` flag to set a different output directory, for example:
```
gulp watch --out=../fabric8-console/libs/hawtio-integration/dist/
```

Whenever the build completes the compiled `.js` file will be put into the target directory.  Don't forget to first do a `gulp build` without this flag before committing changes!

### Turn on source maps generation for debugging TypeScript

If you want to debug `.ts` using a browser developer tool such as Chrome DevTools, pass the `--sourcemap` flag to gulp:

```
gulp --sourcemap
```

Do not use this flag when you are committing the compiled `.js` file, as it embeds source maps to the output file. Use this flag only during development.

### Upgrade Apache Camel

In order to support the latest Camel meta model in Camel plugin, you need to update the [camelModel.js](vendor/apache-camel/camelModel.js) with the latest `camel-catalog`. To do so, first update the Camel version in the `camel-model-generator` [pom.xml](vendor/apache-camel/pom.xml):

```
    <version.org.apache.camel>3.14.2</version.org.apache.camel>
```
then run the following yarn script:
```
yarn update-camel-model
```
