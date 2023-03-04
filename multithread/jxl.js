(function () {
  "use strict";

  const config = {
    useCache: true,
    imageType: 'jpeg' // jpeg/png/webp
  };

  let cache;

  function init() {
    document.body && document.body.querySelectorAll('*').forEach(check);
    new MutationObserver(mutations => mutations.forEach(mutation => mutation.addedNodes.forEach(check))).observe(document.documentElement, {subtree: true, childList: true});
  }

  function check(el) {
    if (el instanceof HTMLImageElement && el.src.endsWith('.jxl'))
      if (el.complete && el.naturalHeight === 0)
        decode(el, false, false)
      else
        el.onerror = () => decode(el, false)
    else if (el instanceof HTMLSourceElement && el.srcset.endsWith('.jxl'))
      decode(el, false, true);
    else if (el instanceof Element && getComputedStyle(el).backgroundImage.endsWith('.jxl")'))
      decode(el, true, false);
    else if (el instanceof Element && typeof el.getElementsByTagName === 'function')
      for (const img of el.getElementsByTagName('img')) {
        if (img instanceof HTMLImageElement && img.src.endsWith('.jxl'))
          if (img.complete && img.naturalHeight === 0)
            decode(img, false, false)
          else
            img.onerror = () => decode(img, false)
      }
  }

  function imgDataToDataURL(img, imgData, isCSS, isSource) {
    const jxlSrc = img.dataset.jxlSrc;
    if (imgData instanceof Blob) {
      dataURLToSrc(img, URL.createObjectURL(imgData), isCSS, isSource);
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = imgData.width;
      canvas.height = imgData.height;
      canvas.getContext('2d').putImageData(imgData, 0, 0);
      canvas.toBlob(blob => {
        dataURLToSrc(img, URL.createObjectURL(blob), isCSS, isSource);
        config.useCache && cache && cache.put(jxlSrc, new Response(blob));
      }, 'image/' + config.imageType);
    }
  }

  function dataURLToSrc(img, dataURL, isCSS, isSource) {
    if (isCSS)
      img.style.backgroundImage = 'url("' + dataURL + '")';
    else if (isSource) {
      img.srcset = dataURL;
      img.type = 'image/' + config.imageType;
    } else
      img.src = dataURL;
  }

  async function decode(img, isCSS, isSource) {
    const jxlSrc = img.dataset.jxlSrc = isCSS ? getComputedStyle(img).backgroundImage.slice(5, -2) : isSource ? img.srcset : img.currentSrc;
    if (!isCSS && !isSource) {
      img.srcset = '';
      img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; // blank 1x1 image
    }
    if (config.useCache) {
      try {
        cache = cache || await caches.open('jxl');
      } catch (e) {}
      const cachedImg = cache && await cache.match(jxlSrc);
      if (cachedImg) {
        const cachedImgData = await cachedImg.blob();
        requestAnimationFrame(() => imgDataToDataURL(img, cachedImgData, isCSS, isSource));
        return;
      }
    }
    const res = await fetch(jxlSrc);
    requestAnimationFrame(() => process(res, img, isCSS, isSource));
  }
  
  async function process(res, img, isCSS, isSource) {
    let module, decoder, buffer, reader, timer;
    const bufferSize = 256 * 1024;

    function readChunk() {
      reader.read().then(onChunk, onError);
    }

    function onChunk(chunk) {
      if (chunk.done) {
        onFinish();
        return;
      }
      let offset = 0;
      while (offset < chunk.value.length) {
        let delta = chunk.value.length - offset;
        if (delta > bufferSize)
          delta = bufferSize;
        module.HEAP8.set(chunk.value.slice(offset, offset + delta), buffer);
        offset += delta;
        if (!processChunk(delta))
          onError('Processing error');
      }
      setTimeout(readChunk, 0);
    }

    function processChunk(chunkLen) {
      const result = processInput(chunkLen);
      if (result.error)
        return false;
      if (result.wantFlush)
        module._jxlFlush(decoder);
      if (result.copyPixels) {
        let width = module.HEAP32[decoder >> 2];
        let height = module.HEAP32[(decoder + 4) >> 2];
        let start = module.HEAP32[(decoder + 8) >> 2];
        let end = start + width * height * 4;
        let src = new Uint8Array(module.HEAP8.buffer);
        let imgData = new ImageData(new Uint8ClampedArray(src.slice(start, end)), width, height);
        requestAnimationFrame(() => imgDataToDataURL(img, imgData, isCSS, isSource));
      }
      return true;
    }

    function processInput(chunkLen) {
      const response = {
        error: false,
        wantFlush: false,
        copyPixels: false
      };
      timer = timer || performance.now();
      let result = module._jxlProcessInput(decoder, buffer, chunkLen);
      if (result === 2) {
          // More input needed
      } else if (result === 1) {
        response.wantFlush = true;
        response.copyPixels = true;
      } else if (result === 0) {
        console.log('Finished decoding', img.dataset.jxlSrc, 'in', performance.now() - timer, 'ms');
        response.wantFlush = false;
        response.copyPixels = true;
      } else {
        response.error = true;
      }
      return response;
    }

    function onError(data) {
      console.error(data);
      onFinish();
    }

    function onFinish() {
      if (module) {
        module._jxlDestroyInstance(decoder);
        module._free(buffer);
      }
      module = decoder = buffer = undefined;
    }

    module = await JxlCodecModule();
    decoder = module._jxlCreateInstance(true, 100);
    if (decoder < 4)
      return onError('Cannot create decoder');
    buffer = module._malloc(bufferSize);
    reader = res.body.getReader();
    readChunk();
  }

  if (!window.crossOriginIsolated)
    throw 'No COOP/COEP response headers';

  const isSimd = WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]));
  const script = document.createElement('script');
  script.src = isSimd ? 'jxl_decoder_simd.min.js' : 'jxl_decoder.min.js';
  script.onload = init;
  document.head.appendChild(script);
}());
