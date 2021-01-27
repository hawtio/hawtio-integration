/// <reference path="diagnostics.service.ts"/>

namespace Diagnostics {

  function splitResponse(response: string) {
    return response.match(/Dumped recording "(.+)",(.+) written to:\r?\n\r?\n(.+)/);
  }

  function buildStartParams(jfrSettings: JfrSettings) {
    const params = [];
    if (jfrSettings.name && jfrSettings.name.length > 0) {
      params.push('name="' + jfrSettings.name + '"');
    }
    if (jfrSettings.filename && jfrSettings.filename.length > 0) {
      params.push('filename="' + jfrSettings.filename + '"');
    }
    params.push('dumponexit=' + jfrSettings.dumpOnExit);
    if (jfrSettings.limitType != 'unlimited') {
      params.push(jfrSettings.limitType + '=' + jfrSettings.limitValue);
    }

    return params;
  }

  function buildDumpParams(jfrSettings: JfrSettings) {
    return [
      'filename="' + jfrSettings.filename + '"',
      'name="' + jfrSettings.name + '"'
    ];
  }

  function updateSettingsFromCurrent(scopeSettings: JfrSettings,  currentConfig: Map<string,string>, currentRecordingNumber: number) : void {
    scopeSettings.dumpOnExit=currentConfig['dumpOnExit'] === "true";
    scopeSettings.filename=null;
    scopeSettings.name=currentConfig['name']
    scopeSettings.recordingNumber=""+currentRecordingNumber;
    if ( currentConfig['duration'] != "0" ) {
      scopeSettings.limitType="duration";
      scopeSettings.limitValue=currentConfig['duration'];
    } 
    if (currentConfig['maxSize'] != "0") {
      scopeSettings.limitType="maxsize";
      scopeSettings.limitValue=currentConfig['maxSize'];
    }
  } 

  function settingsToJfrOptions(settings: JfrSettings) {
    var options = {
      "name": "" + settings.name,
      "dumpOnExit": "" + settings.dumpOnExit
    }
    if ( settings.limitType === "duration") {
      options['duration'] = settings.limitValue;
    } else if( settings.limitType === "maxsize") {
      options['maxSize'] = settings.limitValue;
    }
    return options;
  }

  export interface JfrSettings {
    limitType: string;
    limitValue: string;
    recordingNumber: string;
    dumpOnExit: boolean;
    name: string;
    filename: string;
  }

  export interface Recording {
    number: string;
    size: string;
    file: string;
    time: number;
    canDownload: boolean;
    downloadLink: string;
  }

  export interface RecordingFromJfrBean {
    destination: string;
    maxSize: number;
    duration: number;
    size: number;
    maxAge: number;
    toDisk: boolean;
    name: string;
    startTime: number;
    stopTime: number;
    id: number;
    state: string;
    dumpOnExit: boolean;
    settings: Map<string,string>;
  }

  export interface JfrControllerScope extends ng.IScope {
    forms: any;
    jfrEnabled: boolean;
    isRecording: boolean;
    isRunning: boolean;
    jfrSettings: JfrSettings;
    unlock: () => void;
    startRecording: () => void;
    stopRecording: () => void;
    dumpRecording: () => void;
    downloadRecording: (rec: number) => void;
    formConfig: Forms.FormConfiguration;
    recordings: Array<Recording>;
    pid: string;
    jfrStatus: string;
    pageTitle: string;
    settingsVisible: boolean;
    toggleSettingsVisible: () => void;
    jcmd: string;
    closeMessageForGood: (key: string) => void;
    isMessageVisible: (key: string) => boolean;
  }
  
  
  export function DiagnosticsJfrController($scope: JfrControllerScope, $location: ng.ILocationService,
    workspace: Jmx.Workspace, jolokia: Jolokia.IJolokia, localStorage: Storage, diagnosticsService: DiagnosticsService, jolokiaUrl:string) {
      'ngInject';
      
      //common definitions / setup
      $scope.jfrSettings = {
        limitType: 'unlimited',
        limitValue: '',
        name: '',
        dumpOnExit: true,
        recordingNumber: '',
        filename: ''
      };
      $scope.forms = {};
      $scope.recordings = [];
      $scope.settingsVisible = false;
      $scope.toggleSettingsVisible = () => {
        $scope.settingsVisible = !$scope.settingsVisible;
        Core.$apply($scope);
      };
      $scope.formConfig = <Forms.FormConfiguration>{
        properties: <Forms.FormProperties>{
          name: <Forms.FormElement>{
            type: "java.lang.String",
            tooltip: "Name for this connection",
            "input-attributes": {
              "placeholder": "Recording name (optional)..."
            }
          },
          limitType: <Forms.FormElement>{
            type: "java.lang.String",
            tooltip: "Duration if any",
            enum: ['unlimited', 'duration', 'maxsize']
          },
          limitValue: <Forms.FormElement>{
            type: "java.lang.String",
            tooltip: "Limit value. duration: [val]s/m/h, maxsize: [val]kB/MB/GB",
            required: false,
            "input-attributes": {
              "ng-show": "jfrSettings.limitType != 'unlimited'"
            }
          },
          dumpOnExit: <Forms.FormElement>{
            type: "java.lang.Boolean",
            tooltip: "Automatically dump recording on VM exit"
          },
          filename: <Forms.FormElement>{
            type: "java.lang.String",
            tooltip: "Filename",
            "input-attributes": {
              "placeholder": "Specify file name *.jfr (optional)..."
            }
          },
        }
      };
      const jfrMbean = diagnosticsService.flightRecorderMBean();
      if(jfrMbean) {
        configureScopeForJfr($scope, jolokia, jfrMbean);
      } else {
        configureScopeForDiagnosticCommand($scope, jolokia, localStorage);
      }


    //Use Flight Recorder MBean for controlling flight recorder loosely inspired by: 
    //https://github.com/openjdk/jmc7/blob/master/application/org.openjdk.jmc.rjmx.services.jfr/src/main/java/org/openjdk/jmc/rjmx/services/jfr/internal/FlightRecorderServiceV2.java
    function configureScopeForJfr(scope: JfrControllerScope, 
      jolokia: Jolokia.IJolokia, jfrMBean: string) {
        var currentRecordingNumber=-1;
        //these are not not neccesary for jfr
        scope.unlock = () => {};
        scope.isMessageVisible = (key) => {return false};
        scope.closeMessageForGood = (key) => {};
        //figure out data
        scope.jfrEnabled = true;
        figureOutRecordingsAndSettings(null);

        scope.startRecording = () => {
          jolokia.execute(jfrMBean, "setRecordingOptions", currentRecordingNumber, settingsToJfrOptions(scope.jfrSettings), {});
          jolokia.execute(jfrMBean, "startRecording", currentRecordingNumber);
          scope.isRecording=true;
        };
    
        scope.stopRecording = () => {
          jolokia.execute(jfrMBean, "stopRecording", currentRecordingNumber);
          figureOutRecordingsAndSettings(null);
        };
        scope.dumpRecording = () => {
          if(scope.recordings.length > 0) {
            scope.downloadRecording(Number.parseInt(scope.recordings[scope.recordings.length-1].number)) ;
          }
        };

        scope.downloadRecording = (recordingNumber: number) => {
          const streamId = jolokia.execute(jfrMBean, "openStream", recordingNumber, null);
          log.info("Downloading recording", recordingNumber, ".jfr using stream " , streamId);
          var buffer=new Uint8Array(0);          
          while(true) {
            let value=jolokia.execute(jfrMBean, "readStream", streamId);
            if(Array.isArray(value)) {
              //reuse buffer accross calls if possible 
              if(value.length != buffer.length) {
                buffer=new Uint8Array(value.length);
              }
              for (let index = 0; index < value.length; index++) {
                //the data are served as a long array from Jolokia, but are supposed to be a byte array
                buffer[index]=value[index] & 0xff;
              }

            } else {
              break;
            }
            //TODO: figure out how to get data over to the client            
          }

          Core.register(jolokia, $scope, [{
            type: 'read',
            attribute: 'Recordings',
            mbean: jfrMBean
          }], Core.onSuccess(watchCallback));

        }

        function watchCallback(response : any) {
          figureOutRecordingsAndSettings(response.value);
        }


      function figureOutRecordingsAndSettings(existingRecordings : RecordingFromJfrBean[]) {
        if(existingRecordings==null) {
          existingRecordings=jolokia.getAttribute(jfrMBean, "Recordings");
        } 
        scope.recordings=[];
        var lastRecording : RecordingFromJfrBean;
        for (let index = 0; index < existingRecordings.length; index++) {
          lastRecording = existingRecordings[index];
          if(lastRecording.state === "STOPPED") {
            scope.recordings.push({
              number: "" + lastRecording.id,
              size: lastRecording.size + " b",
              file: null,
              time: lastRecording.stopTime,
              canDownload: true,
              downloadLink: jolokiaUrl + "/exec/jdk.management.jfr:type=FlightRecorder/downloadRecording(long)/" + lastRecording.id});
          }
        }
        if(lastRecording) {
          if(lastRecording.state === "RUNNING") {
            scope.isRecording=true;
            scope.isRunning=true;
          } else {
            scope.isRunning=false;
            scope.isRecording=false;
          }
          scope.jfrStatus="Recording " + lastRecording.id + " name: " + lastRecording.name + " (" + lastRecording.state + ")"
        }
        if (!lastRecording || lastRecording.state === "STOPPED") {
          currentRecordingNumber = jolokia.execute(jfrMBean, "newRecording").value;
        }
        else {
          currentRecordingNumber = lastRecording.id;
        }
        updateSettingsFromCurrent(scope.jfrSettings, jolokia.execute(jfrMBean, "getRecordingOptions", currentRecordingNumber), currentRecordingNumber);
        Core.$apply(scope);
      }
    }
     


    function configureScopeForDiagnosticCommand(scope: JfrControllerScope, 
       jolokia: Jolokia.IJolokia, localStorage: Storage) {
      scope.pid = findMyPid();
  
      scope.unlock = () => {
        executeDiagnosticFunction('vmUnlockCommercialFeatures()', 'VM.unlock_commercial_features', [], null);
      };
  
      scope.startRecording = () => {
        if (scope.isRecording) {//this means that there is a stopped recording, clear state before starting the next
          scope.jfrSettings.name = null;
          scope.jfrSettings.filename = null;
        }
        executeDiagnosticFunction('jfrStart([Ljava.lang.String;)', 'JFR.start', [buildStartParams(scope.jfrSettings)], null);
      };
  
      scope.dumpRecording = () => {
  
        executeDiagnosticFunction('jfrDump([Ljava.lang.String;)', 'JFR.dump',
          [buildDumpParams(scope.jfrSettings)], (response) => {
            const matches = splitResponse(response);
            Diagnostics.log.debug("response: " + response
              + " split: " + matches + "split2: "
              + matches);
            if (matches) {
              const recordingData = {
                number: matches[1],
                size: matches[2],
                file: matches[3],
                time: Date.now(),
                canDownload : false,
                downloadLink : null
              };
              Diagnostics.log.debug("data: "
                + recordingData);
              addRecording(recordingData, scope.recordings);
            }
          });  
      };
      scope.closeMessageForGood = (key: string) => {
        localStorage[key] = "false";
      };
  
      scope.isMessageVisible = (key: string) => {
        return localStorage[key] !== "false";
      };
  
      scope.stopRecording = () => {
        const name = scope.jfrSettings.name;
        scope.jfrSettings.filename = '';
        scope.jfrSettings.name = '';
        executeDiagnosticFunction('jfrStop([Ljava.lang.String;)', 'JFR.stop',
          ['name="' + name + '"'], null);
      };

      Core.register(jolokia, $scope, [{
        type: 'exec',
        operation: 'jfrCheck([Ljava.lang.String;)',
        mbean: 'com.sun.management:type=DiagnosticCommand',
        arguments: ['']
      }], Core.onSuccess(render));
  
  
      function render(response) {
        let statusString = response.value;
        $scope.jfrEnabled = statusString.indexOf("not enabled") == -1;
        $scope.isRunning = statusString.indexOf("(running)") > -1;
        $scope.isRecording = $scope.isRunning || statusString.indexOf("(stopped)") > -1;
        if ((statusString.indexOf("Use JFR.") > -1 || statusString
          .indexOf("Use VM.") > -1)
          && $scope.pid) {
          statusString = statusString.replace("Use ",
            "Use command line: jcmd " + $scope.pid + " ");
        }
        $scope.jfrStatus = statusString;
        if ($scope.isRecording) {
          let regex = /ecording.(\d+):* name="*(.+?)"*/g;
          if ($scope.isRunning) { //if there are several recordings (some stopped), make sure we parse the running one
            regex = /ecording.(\d+):* name="*(.+?)"* \(running\)/g;
          }
  
          const parsed = regex.exec(statusString);
          $scope.jfrSettings.recordingNumber = parsed[1];
          $scope.jfrSettings.name = parsed[2];
          const parsedFilename = statusString.match(/filename="(.+)"/);
          if (parsedFilename && parsedFilename[1]) {
            $scope.jfrSettings.filename = parsedFilename[1];
          } else {
            $scope.jfrSettings.filename = 'recording' + parsed[1] + '.jfr';
          }
  
        }
      Core.$apply($scope);
    }
  
    }
  

    function addRecording(recording: Recording, recordings: Array<Recording>) {
      for (let i = 0; i < recordings.length; i++) {
        if (recordings[i].file === recording.file) {
          recordings[i] = recording;
          return;
        }
      }
      recordings.push(recording);
    }

    function showArguments(arguments: Array<any>) {
      let result = '';
      let first = true;
      for (let i = 0; i < arguments.length; i++) {
        if (first) {
          first = false;
        } else {
          result += ',';
        }
        result += arguments[i];
      }
      return result;
    }

    function executeDiagnosticFunction(operation: string, jcmd: string, arguments, callback) {
      Diagnostics.log.debug(Date.now() + " Invoking operation "
        + operation + " with arguments" + arguments + " settings: " + JSON.stringify($scope.jfrSettings));
      $scope.jcmd = 'jcmd ' + $scope.pid + ' ' + jcmd + ' ' + showArguments(arguments);
      jolokia.request([{
        type: "exec",
        operation: operation,
        mbean: 'com.sun.management:type=DiagnosticCommand',
        arguments: arguments
      }, {
        type: 'exec',
        operation: 'jfrCheck([Ljava.lang.String;)',
        mbean: 'com.sun.management:type=DiagnosticCommand',
        arguments: ['']
      }], Core.onSuccess(function (response) {
        Diagnostics.log.debug("Diagnostic Operation "
          + operation + " was successful" + response.value);
        if (response.request.operation.indexOf("jfrCheck") > -1) {
//          render(response);
        } else {
          if (callback) {
            callback(response.value);
          }
          Core.$apply($scope);
        }
      }, {
        error: function (response) {
          Diagnostics.log.warn("Diagnostic Operation "
            + operation + " failed", response);
        }
      }));
    }
    function findMyPid() {
      //snatch PID from window title
      const name = jolokia.getAttribute('java.lang:type=Runtime', 'Name');
      const regex = /(\d+)@/g;
      const pid = regex.exec(name);
      if (pid && pid[1]) {
        return pid[1];
      } else {
        return null;
      }
    }

  }

}
