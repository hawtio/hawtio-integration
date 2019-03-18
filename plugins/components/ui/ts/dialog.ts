/// <reference path="uiHelpers.ts"/>
/**
 * @module UI
 */
namespace UI {

  /**
   * Simple helper class for creating <a href="http://angular-ui.github.io/bootstrap/#/modal">angular ui bootstrap modal dialogs</a>
   * @class Dialog
   */
  export class Dialog {
    public show = false;

    public options = {
      backdropFade: true,
      dialogFade: true
    };

    /**
     * Opens the dialog
     * @method open
     */
    public open() {
      this.show = true;
    }

    /**
     * Closes the dialog
     * @method close
     */
    public close() {
      this.show = false;
      // lets make sure and remove any backgroup fades
      this.removeBackdropFadeDiv();
      setTimeout(this.removeBackdropFadeDiv, 100);
    }

    removeBackdropFadeDiv() {
      $("div.modal-backdrop").remove();
    }
  }

  export interface MultiItemConfirmActionOptions {
    collection: Array<any>;
    index:string;
    onClose: (result:boolean) => void;
    action:string
    okText?:string
    cancelText?:string
    title?:string
    custom?:string
    okClass?:string
    cancelClass?:string
    customClass?:string
  }

  export function multiItemConfirmActionDialog(options:MultiItemConfirmActionOptions) {
    var $dialog = HawtioCore.injector.get<any>("$dialog");
    return $dialog.dialog({
      resolve: {
        options: () => { return options; }
      },
      templateUrl: UrlHelpers.join(UI.templatePath, 'multiItemConfirmActionDialog.html'),
      controller: ["$scope", "dialog", "options", ($scope, dialog, options:MultiItemConfirmActionOptions) => {
        $scope.options = options;
        $scope.close = (result) => {
          dialog.close();
          options.onClose(result);
        };
        $scope.getName = (item) => {
          return Core.pathGet(item, options.index.split('.'));
        }
      }]
    });
  }

}
