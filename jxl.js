(function () {
  function imgDataToURL(imageData) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }

  async function decode(img) {
    const url = img.src;
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; // blank image
    const res = await fetch(url);
    const image = await res.arrayBuffer();
    const worker = new Worker('jxl_dec.js');
    worker.postMessage({url, image});
    worker.addEventListener('message', m => {
      img.src = imgDataToURL(m.data.result);
    });
  }

  new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      Array.prototype.filter.call(mutation.addedNodes, node => node instanceof HTMLImageElement && node.src.endsWith('.jxl')).forEach(img => {
        img.onerror = () => decode(img);
      });
    });
  }).observe(document.documentElement, {subtree: true, childList: true});
})();
