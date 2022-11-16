(function () {
  let cache;

  function imgDataToURL(img, imgData) {
    var canvas = document.createElement('canvas');
    canvas.width = imgData.width;
    canvas.height = imgData.height;
    canvas.getContext('2d').putImageData(imgData, 0, 0);
    img.style.backgroundImage = 'url("' + canvas.toDataURL() + '")';
  }

  async function imgDataToCanvas(img, imgData) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width === 1 ? imgData.width : img.width;
    canvas.height = img.height === 1 ? imgData.height : img.height;
    canvas.className = img.className;
    canvas.id = img.id;
    canvas.title = img.title;
    canvas.dataset.jxlSrc = img.dataset.jxlSrc;
    const imgBitmap = await window.createImageBitmap(imgData, {resizeWidth: canvas.width, resizeHeight: canvas.height});
    canvas.getContext('2d').drawImage(imgBitmap, 0, 0);
    img.replaceWith(canvas);
  }

  async function decode(img, isCSS) {
    const jxlSrc = isCSS ? getComputedStyle(img).backgroundImage.slice(5, -2) : (img.dataset.jxlSrc = img.currentSrc);
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; // blank 1x1 image
    try {
      cache = await caches.open('jxl');
    } catch (e) {}
    const cachedImg = cache && await cache.match(jxlSrc);
    if (cachedImg) {
      const cachedImgData = new ImageData(new Uint8ClampedArray(await cachedImg.arrayBuffer()), cachedImg.headers.get('width'), cachedImg.headers.get('height'));
      requestAnimationFrame(() => isCSS ? imgDataToURL(img, cachedImgData) : imgDataToCanvas(img, cachedImgData));
      return;
    }
    const res = await fetch(jxlSrc);
    const image = await res.arrayBuffer();
    const worker = new Worker('jxl_dec.js');
    worker.postMessage({jxlSrc, image});
    worker.addEventListener('message', m => {
      const imgData = m.data.result;
      requestAnimationFrame(() => isCSS ? imgDataToURL(img, imgData) : imgDataToCanvas(img, imgData));
      cache && cache.put(jxlSrc, new Response(imgData.data, {headers: {'content-type': 'image/jxl', width: imgData.width, height: imgData.height}}));
    });
  }

  new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      Array.prototype.filter.call(mutation.addedNodes,
        el => (el instanceof HTMLImageElement && el.src.endsWith('.jxl')) || (el instanceof Element && getComputedStyle(el).backgroundImage.endsWith('.jxl")')))
      .forEach(el => {
        if (el instanceof HTMLImageElement)
          el.onerror = () => decode(el, false);
        else
          decode(el, true);
      });
    });
  }).observe(document.documentElement, {subtree: true, childList: true});
})();
