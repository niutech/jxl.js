(function () {
  "use strict";

  const config = {
    useCache: true
  };

  const isSimd = WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]));
  let cache;

  function init() {
    document.body && document.body.querySelectorAll('*').forEach(check);
    new MutationObserver(mutations => mutations.forEach(mutation => mutation.addedNodes.forEach(check))).observe(document.documentElement, {subtree: true, childList: true});
  }

  function check(el) {
    if (el instanceof HTMLImageElement && el.src.endsWith('.jxl'))
      if (el.complete && el.naturalHeight === 0)
        decode(el, false);
      else
        el.onerror = () => decode(el, false);
    else if (el instanceof Element && getComputedStyle(el).backgroundImage.endsWith('.jxl")'))
      decode(el, true);
  }

  function imgDataToDataURL(img, imgData, isCSS) {
    const jxlSrc = img.dataset.jxlSrc;
    if (imgData instanceof Blob) {
      const dataURL = URL.createObjectURL(imgData);
      if (isCSS)
        img.style.backgroundImage = 'url("' + dataURL + '")';
      else
        img.src = dataURL;
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = imgData.width;
      canvas.height = imgData.height;
      canvas.getContext('2d').putImageData(imgData, 0, 0);
      canvas.toBlob(blob => {
        const dataURL = URL.createObjectURL(blob);
        if (isCSS)
          img.style.backgroundImage = 'url("' + dataURL + '")';
        else
          img.src = dataURL;
        config.useCache && cache && cache.put(jxlSrc, new Response(blob));
      }, 'image/jpeg');
    }
  }

  async function decode(img, isCSS) {
    const jxlSrc = img.dataset.jxlSrc = isCSS ? getComputedStyle(img).backgroundImage.slice(5, -2) : img.currentSrc;
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; // blank 1x1 image
    if (config.useCache) {
      try {
        cache = cache || await caches.open('jxl');
      } catch (e) {
      }
      const cachedImg = cache && await cache.match(jxlSrc);
      if (cachedImg) {
        const cachedImgData = await cachedImg.blob();
        requestAnimationFrame(() => imgDataToDataURL(img, cachedImgData, isCSS));
        return;
      }
    }
    const res = await fetch(jxlSrc);
    requestAnimationFrame(() => process(res, img, isCSS));
  }
  
  async function process(res, img, isCSS) {
    let module, decoder, buffer, reader;
    const bufferSize = 100 * 1024;

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
      if (result.wantFlush) {
        const flushResult = module._jxlFlush(decoder);
      }
      if (result.copyPixels) {
        let width = module.HEAP32[decoder >> 2];
        let height = module.HEAP32[(decoder + 4) >> 2];
        let start = module.HEAP32[(decoder + 8) >> 2];
        let end = start + width * height * 4;
        let src = new Uint8Array(module.HEAP8.buffer);
        let imgData = new ImageData(new Uint8ClampedArray(src.slice(start, end)), width, height);
        requestAnimationFrame(() => imgDataToDataURL(img, imgData, isCSS));
      }
      return true;
    }

    function processInput(chunkLen) {
      const response = {
        error: false,
        wantFlush: false,
        copyPixels: false
      };
      let result = module._jxlProcessInput(decoder, buffer, chunkLen);
      if (result === 2) {
          // More input needed
      } else if (result === 1) {
        response.wantFlush = true;
        response.copyPixels = true;
      } else if (result === 0) {
        response.wantFlush = false;
        response.copyPixels = true;
      } else {
        response.error = true;
      }
      return response;
    }

    function onError(data) {
      console.error('Error loading image:', data);
      onFinish();
    }

    function onFinish() {
      module._jxlDestroyInstance(decoder);
      module._free(buffer);
      module = decoder = buffer = undefined;
    }

    module = await JxlCodecModule();
    decoder = module._jxlCreateInstance(true, 100);
    if (decoder < 4) {
      onError('Cannot create decoder');
      return;
    }
    buffer = module._malloc(bufferSize);
    reader = res.body.getReader();
    readChunk();
  }

  const script = document.createElement('script');
  script.src = isSimd ? 'jxl_decoder_simd.min.js' : 'jxl_decoder.min.js';
  script.onload = init;
  document.head.appendChild(script);
}());
