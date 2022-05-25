/*
 * @Author         : zch
 * @Email          : zch@qumitech.com
 * @Description    : 
 * @FilePath       : \src\artoolkit\artoolkitNFT_multi_ES6.worker.js
 * @Date           : 2022-04-19 09:46:53
 * @LastEditTime   : 2022-04-19 12:32:00
 * @LastEditors    : zch
 */
var browser = (function() {
  var test = function(regexp) {return regexp.test(navigator.userAgent)}
  switch (true) {
      case test(/edg/i): return "Microsoft Edge";
      case test(/trident/i): return "Microsoft Internet Explorer";
      case test(/firefox|fxios/i): return "Mozilla Firefox";
      case test(/opr\//i): return "Opera";
      case test(/ucbrowser/i): return "UC Browser";
      case test(/samsungbrowser/i): return "Samsung Browser";
      case test(/chrome|chromium|crios/i): return "Google Chrome";
      case test(/safari/i): return "Apple Safari";
      default: return "Other";
  }
})();

if(browser == "Apple Safari") {
  importScripts("ARToolkitNFT.js");
} else {
  importScripts("ARToolkitNFT_simd.js");
}

self.onmessage = function (e) {
  var msg = e.data;
  switch (msg.type) {
    case "load": {
      load(msg);
      return;
    }
    case "process": {
      next = msg.imagedata;
      process();
      break;
    }
    case "addMarkers" :{
      loadNFTMarkers(msg.markers)
      break;
    }
  }
};

var next = null;
var ar = null;
var markerResult = null;

function loadNFTMarkers(markers){
  ar.loadNFTMarkers(markers, function (ids) {
    for (var i = 0; i < ids.length; i++) {
      ar.trackNFTMarkerId(i);
    }
    //console.log("loadNFTMarker -> ", ids);
    postMessage({ type: "endLoading", end: true });
  }).catch(function (err) {
    console.log("Error in loading marker on Worker", err);
  });
}

function load(msg) {
  //console.debug("Loading marker at: ", msg.markers);

  var onLoad = function (arController) {
    ar = arController;
    var cameraMatrix = ar.getCameraMatrix();

    ar.addEventListener("getNFTMarker", function (ev) {
      markerResult = {
        type: "found",
        index: JSON.stringify(ev.data.index),
        matrixGL_RH: JSON.stringify(ev.data.matrixGL_RH),
      };
    });

    loadNFTMarkers(msg.markers)

    postMessage({ type: "loaded", proj: JSON.stringify(cameraMatrix) });
  };

  var onError = function (error) {
    console.error(error);
  };

  //console.debug("Loading camera at:", msg.camera_para);

  // we cannot pass the entire ARControllerNFT, so we re-create one inside the Worker, starting from camera_param
  ARToolkitNFT.ARControllerNFT.initWithDimensions(
    msg.pw,
    msg.ph,
    msg.camera_para
  )
    .then(onLoad)
    .catch(onError);
}

function process() {
  markerResult = null;

  if (ar && ar.process && next) {
    ar.process(next);
  }

  if (markerResult) {
    postMessage(markerResult);
  } else {
    postMessage({ type: "not found" });
  }

  next = null;
}
