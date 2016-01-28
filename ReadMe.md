## hawtio-integration

This plugin provides ActiveMQ, Camel, and Karaf plugins for hawtio

### Basic usage

#### Running this plugin locally

First clone the source

    git clone https://github.com/hawtio/hawtio-integration
    cd hawtio-integration

Next you'll need to [install NodeJS](http://nodejs.org/download/) and then install the default global npm dependencies:

    npm install -g bower gulp slush slush-hawtio-javascript slush-hawtio-typescript typescript

Then install all local nodejs packages and update bower dependencies via:

    npm install
    bower update

Then to run the web application:

    gulp

#### Install the bower package

`bower install --save hawtio-integration`

#### Output build to a different directory

When developing this plugin in a dependent console you can change the output directory where the compiled .js and .css go.  Just use the 'out' flag to set a different output directory, for example:

`gulp watch --out=../fabric8-console/libs/hawtio-integration/dist/`

Whenever the build completes the compiled .js file will be put into the target directory.  Don't forget to first do a `gulp build` without this flag before committing changes!


