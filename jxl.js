(function () {
  "use strict";

  const config = {
    useCache: true,
    imageType: 'jpeg' // jpeg/png/webp
  };

  let cache, workers = {};

  function imgDataToDataURL(img, imgData, isCSS, isSource) {
    const jxlSrc = img.dataset.jxlSrc;
    if (imgData instanceof Blob) {
      dataURLToSrc(img, URL.createObjectURL(imgData), isCSS, isSource);
    } else if ('OffscreenCanvas' in window) {
      const canvas = new OffscreenCanvas(imgData.width, imgData.height);
      workers[jxlSrc].postMessage({canvas, imgData, imageType: config.imageType}, [canvas]);
      workers[jxlSrc].addEventListener('message', m => {
        if (m.data.url && m.data.blob) {
          dataURLToSrc(img, m.data.url, isCSS, isSource);
          config.useCache && cache && cache.put(jxlSrc, new Response(m.data.blob));
        }
      });
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
    const image = await res.arrayBuffer();
    workers[jxlSrc] = new Worker('jxl_dec.js');
    workers[jxlSrc].postMessage({jxlSrc, image});
    workers[jxlSrc].addEventListener('message', m => m.data.imgData && requestAnimationFrame(() => imgDataToDataURL(img, m.data.imgData, isCSS, isSource)));
  }

  new MutationObserver(mutations => mutations.forEach(mutation => mutation.addedNodes.forEach(el => {
    const isJxl = (str) => (str.match(/\.jxl(\?.*)?$/));
    if (el instanceof HTMLImageElement && isJxl(el.src))
      el.onerror = () => decode(el, false, false);
    else if (el instanceof HTMLSourceElement && isJxl(el.srcset))
      decode(el, false, true);
    else if (el instanceof Element && isJxl(getComputedStyle(el).backgroundImage.replace(new RegExp('"\\)$'), '')))
      decode(el, true, false);
  }))).observe(document.documentElement, {subtree: true, childList: true});
}());
