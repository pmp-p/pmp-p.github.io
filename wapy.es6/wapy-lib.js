
  var Module = typeof Module !== 'undefined' ? Module : {};
  
  if (!Module.expectedDataFileDownloads) {
    Module.expectedDataFileDownloads = 0;
    Module.finishedDataFileDownloads = 0;
  }
  Module.expectedDataFileDownloads++;
  (function() {
   var loadPackage = function(metadata) {
  
      var PACKAGE_PATH;
      if (typeof window === 'object') {
        PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf('/')) + '/');
      } else if (typeof location !== 'undefined') {
        // worker
        PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf('/')) + '/');
      } else {
        throw 'using preloaded data can only be done on a web page or in a web worker';
      }
      var PACKAGE_NAME = 'wapy-lib.data';
      var REMOTE_PACKAGE_BASE = 'wapy-lib.data';
      if (typeof Module['locateFilePackage'] === 'function' && !Module['locateFile']) {
        Module['locateFile'] = Module['locateFilePackage'];
        err('warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)');
      }
      var REMOTE_PACKAGE_NAME = Module['locateFile'] ? Module['locateFile'](REMOTE_PACKAGE_BASE, '') : REMOTE_PACKAGE_BASE;
    
      var REMOTE_PACKAGE_SIZE = metadata['remote_package_size'];
      var PACKAGE_UUID = metadata['package_uuid'];
    
      function fetchRemotePackage(packageName, packageSize, callback, errback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', packageName, true);
        xhr.responseType = 'arraybuffer';
        xhr.onprogress = function(event) {
          var url = packageName;
          var size = packageSize;
          if (event.total) size = event.total;
          if (event.loaded) {
            if (!xhr.addedTotal) {
              xhr.addedTotal = true;
              if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
              Module.dataFileDownloads[url] = {
                loaded: event.loaded,
                total: size
              };
            } else {
              Module.dataFileDownloads[url].loaded = event.loaded;
            }
            var total = 0;
            var loaded = 0;
            var num = 0;
            for (var download in Module.dataFileDownloads) {
            var data = Module.dataFileDownloads[download];
              total += data.total;
              loaded += data.loaded;
              num++;
            }
            total = Math.ceil(total * Module.expectedDataFileDownloads/num);
            if (Module['setStatus']) Module['setStatus']('Downloading data... (' + loaded + '/' + total + ')');
          } else if (!Module.dataFileDownloads) {
            if (Module['setStatus']) Module['setStatus']('Downloading data...');
          }
        };
        xhr.onerror = function(event) {
          throw new Error("NetworkError for: " + packageName);
        }
        xhr.onload = function(event) {
          if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            var packageData = xhr.response;
            callback(packageData);
          } else {
            throw new Error(xhr.statusText + " : " + xhr.responseURL);
          }
        };
        xhr.send(null);
      };

      function handleError(error) {
        console.error('package error:', error);
      };
    
        var fetchedCallback = null;
        var fetched = Module['getPreloadedPackage'] ? Module['getPreloadedPackage'](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE) : null;

        if (!fetched) fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(data) {
          if (fetchedCallback) {
            fetchedCallback(data);
            fetchedCallback = null;
          } else {
            fetched = data;
          }
        }, handleError);
      
    function runWithFS() {
  
      function assert(check, msg) {
        if (!check) throw msg + new Error().stack;
      }
  Module['FS_createPath']('/', 'lib', true, true);
Module['FS_createPath']('/', 'assets', true, true);
Module['FS_createPath']('/assets', 'pythons', true, true);
Module['FS_createPath']('/assets/pythons', 'aio', true, true);
Module['FS_createPath']('/assets/pythons/aio', 'irc', true, true);
Module['FS_createPath']('/assets/pythons/aio', 'cpy', true, true);
Module['FS_createPath']('/assets/pythons/aio', 'upy', true, true);
Module['FS_createPath']('/assets/pythons', 'js', true, true);
Module['FS_createPath']('/assets/pythons', 'fixes', true, true);

      /** @constructor */
      function DataRequest(start, end, audio) {
        this.start = start;
        this.end = end;
        this.audio = audio;
      }
      DataRequest.prototype = {
        requests: {},
        open: function(mode, name) {
          this.name = name;
          this.requests[name] = this;
          Module['addRunDependency']('fp ' + this.name);
        },
        send: function() {},
        onload: function() {
          var byteArray = this.byteArray.subarray(this.start, this.end);
          this.finish(byteArray);
        },
        finish: function(byteArray) {
          var that = this;
  
          Module['FS_createPreloadedFile'](this.name, null, byteArray, true, true, function() {
            Module['removeRunDependency']('fp ' + that.name);
          }, function() {
            if (that.audio) {
              Module['removeRunDependency']('fp ' + that.name); // workaround for chromium bug 124926 (still no audio with this, but at least we don't hang)
            } else {
              err('Preloading file ' + that.name + ' failed');
            }
          }, false, true); // canOwn this data in the filesystem, it is a slide into the heap that will never change
  
          this.requests[this.name] = null;
        }
      };
  
    
      function processPackageData(arrayBuffer) {
        Module.finishedDataFileDownloads++;
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer instanceof ArrayBuffer, 'bad input to processPackageData');
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        
            var compressedData = {"data":null,"cachedOffset":134364,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,553,624,665,726,787,838,1065,1241,1367,1581,1643,1702,1757,1807,2009,2162,2251,2312,2371,2433,2542,2836,3058,3204,3276,3512,3711,3870,4139,4386,4539,4664,4777,4925,5089,5239,5286,5311,5406,5516,5758,5913,6115,6347,6529,6650,6793,7028,7204,7386,7566,7731,7852,7991,8127,8225,8361,8490,8783,8982,9271,9416,9608,9885,10010,10200,10380,10533,10701,10834,10931,11063,11187,11347,11401,11426,11491,11670,11779,11927,12166,12372,12502,12736,12871,12970,13103,13229,13474,13603,13744,13870,13960,14085,14207,14487,14686,14864,15021,15143,15243,15362,15520,15655,15797,15931,16059,16148,16252,16367,16490,16657,16781,16806,16865,16992,17103,17233,17334,17573,17760,17949,18033,18139,18247,18476,18650,18821,18944,19049,19281,19387,19524,19742,19889,20015,20144,20238,20334,20478,20695,20896,21030,21155,21254,21511,21616,21741,21923,22165,22229,22254,22294,22406,22611,22709,22910,23141,23287,23382,23479,23593,23807,24006,24173,24370,24478,24574,24677,24803,25058,25196,25316,25431,25523,25627,25743,25953,26171,26284,26397,26491,26591,26695,26805,27009,27162,27279,27363,27388,27413,27491,27573,27658,27740,27825,27891,27974,28055,28142,28236,28335,28430,28562,28635,28727,28821,28920,29056,29159,29263,29347,29452,29555,29645,29756,29861,29966,30070,30145,30246,30352,30457,30561,30707,30814,30887,30912,30937,31002,31109,31205,31300,31379,31463,31550,31638,31733,31829,31925,32035,32118,32209,32307,32417,32527,32640,32750,32839,32931,33031,33147,33257,33396,33506,33615,33695,33797,33897,34007,34116,34226,34336,34422,34531,34564,34589,34763,34920,35058,35196,35333,35468,35605,35754,35928,36077,36219,36345,36488,36636,36786,36925,37074,37258,37390,37522,37671,37836,37989,38138,38287,38435,38555,38706,38855,39004,39192,39327,39470,39590,39749,39867,39987,40053,40149,40310,40439,40574,40713,40850,40994,41138,41282,41426,41547,41683,41825,41970,42144,42287,42429,42556,42710,42867,43014,43158,43301,43444,43588,43700,43848,43996,44167,44305,44439,44573,44709,44849,44982,45225,45321,45346,45442,45673,45814,45958,46094,46240,46363,46481,46605,46731,46871,47024,47167,47314,47455,47643,47805,47969,48154,48300,48496,48697,48891,49073,49223,49405,49584,49782,49996,50201,50409,50578,50770,50952,51096,51307,51484,51616,51747,51947,52126,52278,52496,52706,52915,53113,53282,53460,53641,53855,54076,54282,54499,54672,54854,55057,55214,55420,55631,55835,56037,56210,56396,56573,56789,57002,57207,57414,57587,57778,57967,58105,58315,58526,58693,58811,58959,59140,59288,59506,59720,59937,60132,60329,60513,60718,60850,61071,61282,61498,61680,61866,62073,62229,62380,62533,62672,62814,62975,63145,63330,63461,63605,63767,63917,64097,64289,64482,64634,64845,65048,65250,65387,65548,65573,65742,65847,66049,66175,66270,66403,66531,66814,67003,67172,67324,67418,67546,67671,67963,68136,68290,68460,68570,68855,68995,69242,69517,69698,69841,69978,70083,70269,70391,70601,70786,70911,71058,71294,71498,71695,71720,71745,71834,71988,72100,72224,72377,72538,72773,72984,73106,73216,73371,73567,73743,74018,74347,74557,74631,74748,74922,75072,75122,75347,75499,75598,75639,75700,75761,75812,76039,76215,76341,76555,76617,76676,76731,76784,78027,79165,80160,81345,82547,83899,85033,86359,87543,88795,90283,91479,92676,93659,94882,95648,96830,97885,99096,100313,101589,102597,103866,105149,106424,107447,108619,109682,110869,112402,113636,114841,115883,117118,118463,119703,121460,123265,125017,126246,127341,128204,129419,130502,131694,132770,134133],"sizes":[553,71,41,61,61,51,227,176,126,214,62,59,55,50,202,153,89,61,59,62,109,294,222,146,72,236,199,159,269,247,153,125,113,148,164,150,47,25,95,110,242,155,202,232,182,121,143,235,176,182,180,165,121,139,136,98,136,129,293,199,289,145,192,277,125,190,180,153,168,133,97,132,124,160,54,25,65,179,109,148,239,206,130,234,135,99,133,126,245,129,141,126,90,125,122,280,199,178,157,122,100,119,158,135,142,134,128,89,104,115,123,167,124,25,59,127,111,130,101,239,187,189,84,106,108,229,174,171,123,105,232,106,137,218,147,126,129,94,96,144,217,201,134,125,99,257,105,125,182,242,64,25,40,112,205,98,201,231,146,95,97,114,214,199,167,197,108,96,103,126,255,138,120,115,92,104,116,210,218,113,113,94,100,104,110,204,153,117,84,25,25,78,82,85,82,85,66,83,81,87,94,99,95,132,73,92,94,99,136,103,104,84,105,103,90,111,105,105,104,75,101,106,105,104,146,107,73,25,25,65,107,96,95,79,84,87,88,95,96,96,110,83,91,98,110,110,113,110,89,92,100,116,110,139,110,109,80,102,100,110,109,110,110,86,109,33,25,174,157,138,138,137,135,137,149,174,149,142,126,143,148,150,139,149,184,132,132,149,165,153,149,149,148,120,151,149,149,188,135,143,120,159,118,120,66,96,161,129,135,139,137,144,144,144,144,121,136,142,145,174,143,142,127,154,157,147,144,143,143,144,112,148,148,171,138,134,134,136,140,133,243,96,25,96,231,141,144,136,146,123,118,124,126,140,153,143,147,141,188,162,164,185,146,196,201,194,182,150,182,179,198,214,205,208,169,192,182,144,211,177,132,131,200,179,152,218,210,209,198,169,178,181,214,221,206,217,173,182,203,157,206,211,204,202,173,186,177,216,213,205,207,173,191,189,138,210,211,167,118,148,181,148,218,214,217,195,197,184,205,132,221,211,216,182,186,207,156,151,153,139,142,161,170,185,131,144,162,150,180,192,193,152,211,203,202,137,161,25,169,105,202,126,95,133,128,283,189,169,152,94,128,125,292,173,154,170,110,285,140,247,275,181,143,137,105,186,122,210,185,125,147,236,204,197,25,25,89,154,112,124,153,161,235,211,122,110,155,196,176,275,329,210,74,117,174,150,50,225,152,99,41,61,61,51,227,176,126,214,62,59,55,53,1243,1138,995,1185,1202,1352,1134,1326,1184,1252,1488,1196,1197,983,1223,766,1182,1055,1211,1217,1276,1008,1269,1283,1275,1023,1172,1063,1187,1533,1234,1205,1042,1235,1345,1240,1757,1805,1752,1229,1095,863,1215,1083,1192,1076,1363,231],"successes":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
;
            compressedData['data'] = byteArray;
            assert(typeof LZ4 === 'object', 'LZ4 not present - was your app build with  -s LZ4=1  ?');
            LZ4.loadPackage({ 'metadata': metadata, 'compressedData': compressedData });
            Module['removeRunDependency']('datafile_wapy-lib.data');
      
      };
      Module['addRunDependency']('datafile_wapy-lib.data');
    
      if (!Module.preloadResults) Module.preloadResults = {};
    
        Module.preloadResults[PACKAGE_NAME] = {fromCache: false};
        if (fetched) {
          processPackageData(fetched);
          fetched = null;
        } else {
          fetchedCallback = processPackageData;
        }
      
    }
    if (Module['calledRun']) {
      runWithFS();
    } else {
      if (!Module['preRun']) Module['preRun'] = [];
      Module["preRun"].push(runWithFS); // FS is not initialized yet, wait for it
    }
  
    Module['removeRunDependency']('wapy-lib.js.metadata');
   }

   function runMetaWithFS() {
    Module['addRunDependency']('wapy-lib.js.metadata');
    var REMOTE_METADATA_NAME = Module['locateFile'] ? Module['locateFile']('wapy-lib.js.metadata', '') : 'wapy-lib.js.metadata';
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
     if (xhr.readyState === 4 && xhr.status === 200) {
       loadPackage(JSON.parse(xhr.responseText));
     }
    }
    xhr.open('GET', REMOTE_METADATA_NAME, true);
    xhr.overrideMimeType('application/json');
    xhr.send(null);
   }

   if (Module['calledRun']) {
    runMetaWithFS();
   } else {
    if (!Module['preRun']) Module['preRun'] = [];
    Module["preRun"].push(runMetaWithFS);
   }
  
  })();
  