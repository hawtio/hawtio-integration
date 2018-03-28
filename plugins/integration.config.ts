namespace Integration {

  export function configureAboutPage(aboutService: About.AboutService) {
    'ngInject';
    aboutService.addProductInfo('Hawtio Integration', 'PACKAGE_VERSION_PLACEHOLDER');
  }

}