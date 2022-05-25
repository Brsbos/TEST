function isMobile () {
  return /Android|mobile|iPad|iPhone/i.test(navigator.userAgent);
}

var worker = null
var stopProcess = false

function start(markerUrls, video, input_width, input_height) {
  stopProcess = false
  var vw, vh;
  var sw, sh;
  var pscale, sscale;
  var w, h;
  var pw, ph;
  var ox, oy;
  var camera_para = '../../resources/nft/camera_para.dat'

  var canvas_process = document.createElement('canvas');
  var context_process = canvas_process.getContext('2d');

  var load = function () {
    vw = input_width;
    vh = input_height;

    pscale = 320 / Math.max(vw, vh / 3 * 4);
    sscale = isMobile() ? window.outerWidth / input_width : 1;

    sw = vw * sscale;
    sh = vh * sscale;

    w = vw * pscale;
    h = vh * pscale;
    pw = Math.max(w, h / 3 * 4);
    ph = Math.max(h, w / 4 * 3);
    ox = (pw - w) / 2;
    oy = (ph - h) / 2;
    canvas_process.style.clientWidth = pw + "px";
    canvas_process.style.clientHeight = ph + "px";
    canvas_process.width = pw;
    canvas_process.height = ph;

    worker = new Worker('src/artoolkit/artoolkitNFT_multi_ES6.worker.js')

    worker.postMessage({ type: "load", pw: pw, ph: ph, camera_para: camera_para, markers: markerUrls });

    worker.onmessage = function (ev) {
      var msg = ev.data;
      switch (msg.type) {
        case "loaded": {
          //workerLog("worker_loaded:",msg)
          break;
        }
        case "endLoading": {
          if (msg.end == true) {
            sendEvent("arjs-nft-loaded")
          }
          break;
        }
        case 'found': {
          workerLog("found:",msg)
          if(!stopProcess)found(msg);
          break;
        }
        case 'not found': {
          if(!stopProcess)found(null);
          break;
        }
      }

      setTimeout(()=>{
        process();
      } , 500)
    };
  };

  var found = function (msg) {
    if (msg) {
      index = JSON.parse(msg.index);
      sendEvent("nft-marker-found" , index)
    }
  };

  var process = function () {
    var imageData = null
    if(!stopProcess){
      context_process.fillStyle = 'black';
      context_process.fillRect(0, 0, pw, ph);
      context_process.drawImage(video, 0, 0, vw, vh, ox, oy, w, h);

      imageData = context_process.getImageData(0, 0, pw, ph);
    }
    worker.postMessage({ type: 'process', imagedata: imageData });
  }

  load();
  process();
}

function addNFTMarkers(markerUrls){
  worker.postMessage({ type: "addMarkers" , markers: markerUrls });
}

function workerLog(title , msg , iserror){
  sendEvent("log" , {
    title:title,
    msg:msg,
    iserror:iserror
  })
}

function sendEvent(event_name , content){
  window.dispatchEvent(new CustomEvent(event_name , {
    detail:content
  }))
}