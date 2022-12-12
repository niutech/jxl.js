(function () {
  "use strict";

  const config = {
    useCache: true,
    imageType: "jpeg" // jpeg/png/webp
  };

  let cache, workers = {};

  function imgDataToDataURL(img, imgData, isCSS) {
    const jxlSrc = img.dataset.jxlSrc;
    if (imgData instanceof Blob) {
      const dataURL = URL.createObjectURL(imgData);
      if (isCSS)
        img.style.backgroundImage = 'url("' + dataURL + '")';
      else
        img.src = dataURL;
    } else if ('OffscreenCanvas' in window) {
      const canvas = new OffscreenCanvas(imgData.width, imgData.height);
      workers[jxlSrc].postMessage({canvas, imgData, imageType: config.imageType}, [canvas]);
      workers[jxlSrc].addEventListener('message', m => {
        if (m.data.url && m.data.blob) {
          if (isCSS)
            img.style.backgroundImage = 'url("' + m.data.url + '")';
          else
            img.src = m.data.url;
          config.useCache && cache && cache.put(jxlSrc, new Response(m.data.blob));
        }
      });
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
      }, 'image/' + config.imageType);
    }
  }

  async function decode(img, isCSS) {
    const jxlSrc = img.dataset.jxlSrc = isCSS ? getComputedStyle(img).backgroundImage.slice(5, -2) : img.currentSrc;
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; // blank 1x1 image
    if (config.useCache) {
      try {
        cache = cache || await caches.open('jxl');
      } catch (e) {}
      const cachedImg = cache && await cache.match(jxlSrc);
      if (cachedImg) {
        const cachedImgData = await cachedImg.blob();
        requestAnimationFrame(() => imgDataToDataURL(img, cachedImgData, isCSS));
        return;
      }
    }
    const res = await fetch(jxlSrc);
    const image = await res.arrayBuffer();
    workers[jxlSrc] = new Worker('jxl_dec.js');
    workers[jxlSrc].postMessage({jxlSrc, image});
    workers[jxlSrc].addEventListener('message', m => m.data.imgData && requestAnimationFrame(() => imgDataToDataURL(img, m.data.imgData, isCSS)));
  }

  new MutationObserver(mutations => mutations.forEach(mutation => Array.prototype.filter.call(mutation.addedNodes,
    el => (el instanceof HTMLImageElement && el.src.endsWith('.jxl')) || (el instanceof Element && getComputedStyle(el).backgroundImage.endsWith('.jxl")')))
    .forEach(el => {
      if (el instanceof HTMLImageElement)
        el.onerror = () => decode(el, false);
      else
        decode(el, true);
    }))).observe(document.documentElement, {subtree: true, childList: true});
}());
