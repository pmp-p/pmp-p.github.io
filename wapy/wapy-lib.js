
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
  Module['FS_createPath']('/', 'assets', true, true);
Module['FS_createPath']('/', 'lib', true, true);
Module['FS_createPath']('/assets', 'python3', true, true);
Module['FS_createPath']('/assets/python3', 'aio', true, true);
Module['FS_createPath']('/assets/python3/aio', 'irc', true, true);
Module['FS_createPath']('/assets/python3/aio', 'cpy', true, true);
Module['FS_createPath']('/assets/python3/aio', 'upy', true, true);

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
        
            var compressedData = {"data":null,"cachedOffset":104169,"cachedIndexes":[-1,-1],"cachedChunks":[null,null],"offsets":[0,1430,1871,1949,2163,2231,2296,2360,2417,2637,2800,3014,3081,3146,3214,3271,3506,3695,3785,3857,3922,3989,4104,4388,4634,4819,4942,5154,5362,5533,5723,5979,6209,6356,6473,6606,6775,6931,6964,6989,7083,7233,7471,7625,7836,8038,8270,8423,8556,8798,8966,9157,9339,9550,9699,9840,9991,10095,10306,10441,10737,11001,11158,11322,11551,11654,11788,11927,12207,12403,12573,12732,12833,12958,13081,13185,13246,13271,13337,13537,13632,13794,13997,14266,14458,14683,14842,14948,15077,15209,15381,15594,15768,15903,16027,16125,16246,16526,16770,16964,17143,17285,17393,17498,17620,17874,18070,18204,18314,18418,18527,18641,18777,18963,19077,19102,19161,19305,19416,19631,19758,19940,20171,20369,20470,20734,20840,20988,21208,21350,21488,21624,21727,21823,21955,22091,22254,22402,22536,22645,22903,23017,23142,23361,23515,23625,23758,23861,23974,24104,24332,24584,24729,24754,24800,24909,25152,25280,25485,25700,25863,25984,26088,26193,26314,26577,26712,26912,27033,27133,27228,27364,27493,27649,27785,27905,28011,28122,28363,28475,28720,28867,28928,29040,29160,29273,29368,29452,29642,29841,29931,29956,29989,30082,30178,30263,30345,30431,30520,30579,30656,30750,30845,30944,31038,31170,31249,31339,31446,31556,31692,31796,31900,32003,32100,32198,32297,32408,32512,32617,32722,32800,32899,32990,33095,33200,33346,33452,33526,33551,33576,33642,33748,33844,33940,34036,34113,34205,34302,34398,34494,34589,34699,34788,34880,34977,35092,35202,35315,35425,35534,35614,35715,35815,35925,36064,36174,36284,36367,36476,36561,36671,36781,36891,37000,37099,37185,37210,37235,37424,37582,37731,37880,38006,38149,38297,38447,38585,38734,38876,39008,39149,39299,39462,39612,39761,39945,40093,40215,40362,40511,40663,40812,40961,41110,41234,41391,41525,41685,41874,42002,42134,42257,42394,42530,42634,42699,42804,42976,43127,43248,43390,43537,43682,43815,43959,44103,44230,44367,44518,44678,44863,45006,45148,45290,45429,45576,45730,45873,46016,46159,46304,46420,46566,46702,46884,47023,47150,47273,47418,47551,47673,47945,48023,48048,48156,48386,48515,48666,48821,48959,49089,49206,49337,49463,49605,49768,49926,50062,50206,50384,50578,50719,50890,51057,51253,51457,51656,51834,51999,52187,52362,52501,52707,52912,53116,53290,53481,53663,53840,54058,54235,54374,54525,54693,54875,55052,55266,55483,55691,55905,56078,56260,56467,56649,56859,57068,57275,57477,57654,57843,58021,58230,58444,58653,58857,59027,59219,59404,59549,59754,59959,60162,60340,60530,60715,60886,61103,61314,61488,61606,61763,61950,62144,62276,62497,62713,62939,63072,63260,63475,63649,63859,64073,64279,64490,64670,64865,65063,65198,65354,65498,65622,65793,65969,66142,66279,66415,66583,66748,66894,67085,67278,67483,67638,67846,68053,68189,68344,68369,68537,68649,68846,68984,69092,69218,69347,69624,69878,70034,70199,70332,70439,70581,70711,70904,71100,71268,71434,71540,71675,71937,72198,72439,72567,72699,72816,72941,73071,73260,73489,73646,73783,74026,74175,74380,74405,74430,74546,74656,74793,74900,75057,75228,75451,75693,75837,75982,76096,76289,76473,76669,76993,77241,77384,77475,77646,77808,77865,78092,78288,78427,78641,78709,78774,78838,78895,79115,79278,79492,79559,79624,79698,79755,81065,82205,83222,84486,85771,87114,88306,89538,90963,92231,93268,94409,95555,96855,97645,98814,99890,101128,102311,103492],"sizes":[1430,441,78,214,68,65,64,57,220,163,214,67,65,68,57,235,189,90,72,65,67,115,284,246,185,123,212,208,171,190,256,230,147,117,133,169,156,33,25,94,150,238,154,211,202,232,153,133,242,168,191,182,211,149,141,151,104,211,135,296,264,157,164,229,103,134,139,280,196,170,159,101,125,123,104,61,25,66,200,95,162,203,269,192,225,159,106,129,132,172,213,174,135,124,98,121,280,244,194,179,142,108,105,122,254,196,134,110,104,109,114,136,186,114,25,59,144,111,215,127,182,231,198,101,264,106,148,220,142,138,136,103,96,132,136,163,148,134,109,258,114,125,219,154,110,133,103,113,130,228,252,145,25,46,109,243,128,205,215,163,121,104,105,121,263,135,200,121,100,95,136,129,156,136,120,106,111,241,112,245,147,61,112,120,113,95,84,190,199,90,25,33,93,96,85,82,86,89,59,77,94,95,99,94,132,79,90,107,110,136,104,104,103,97,98,99,111,104,105,105,78,99,91,105,105,146,106,74,25,25,66,106,96,96,96,77,92,97,96,96,95,110,89,92,97,115,110,113,110,109,80,101,100,110,139,110,110,83,109,85,110,110,110,109,99,86,25,25,189,158,149,149,126,143,148,150,138,149,142,132,141,150,163,150,149,184,148,122,147,149,152,149,149,149,124,157,134,160,189,128,132,123,137,136,104,65,105,172,151,121,142,147,145,133,144,144,127,137,151,160,185,143,142,142,139,147,154,143,143,143,145,116,146,136,182,139,127,123,145,133,122,272,78,25,108,230,129,151,155,138,130,117,131,126,142,163,158,136,144,178,194,141,171,167,196,204,199,178,165,188,175,139,206,205,204,174,191,182,177,218,177,139,151,168,182,177,214,217,208,214,173,182,207,182,210,209,207,202,177,189,178,209,214,209,204,170,192,185,145,205,205,203,178,190,185,171,217,211,174,118,157,187,194,132,221,216,226,133,188,215,174,210,214,206,211,180,195,198,135,156,144,124,171,176,173,137,136,168,165,146,191,193,205,155,208,207,136,155,25,168,112,197,138,108,126,129,277,254,156,165,133,107,142,130,193,196,168,166,106,135,262,261,241,128,132,117,125,130,189,229,157,137,243,149,205,25,25,116,110,137,107,157,171,223,242,144,145,114,193,184,196,324,248,143,91,171,162,57,227,196,139,214,68,65,64,57,220,163,214,67,65,74,57,1310,1140,1017,1264,1285,1343,1192,1232,1425,1268,1037,1141,1146,1300,790,1169,1076,1238,1183,1181,677],"successes":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]}
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
  