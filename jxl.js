(function () {
  async function imgDataToCanvas(img, imgData) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width === 1 ? imgData.width : img.width;
    canvas.height = img.height === 1 ? imgData.height : img.height;
    canvas.className = img.className;
    canvas.id = img.id;
    canvas.dataset.jxlSrc = img.dataset.jxlSrc;
    const imgBitmap = await window.createImageBitmap(imgData, {resizeWidth: canvas.width, resizeHeight: canvas.height});
    canvas.getContext('2d').drawImage(imgBitmap, 0, 0);
    img.replaceWith(canvas);
  }

  async function decode(img) {
    img.dataset.jxlSrc = img.src;
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; // blank image
    const res = await fetch(img.dataset.jxlSrc);
    const image = await res.arrayBuffer();
    const worker = new Worker('jxl_dec.js');
    worker.postMessage({url: img.dataset.jxlSrc, image});
    worker.addEventListener('message', m => imgDataToCanvas(img, m.data.result));
  }

  new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      Array.prototype.filter.call(mutation.addedNodes, node => node instanceof HTMLImageElement && node.src.endsWith('.jxl')).forEach(img => {
        img.onerror = () => decode(img);
      });
    });
  }).observe(document.documentElement, {subtree: true, childList: true});
})();
