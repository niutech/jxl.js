(function () {
  "use strict";

  const config = {
      useCache: true,
      compressCache: false
  };

  const SnappyJS = function(){var r=Array(15);function n(r,n){return 506832829*r>>>n}function f(r,n){return r[n]+(r[n+1]<<8)+(r[n+2]<<16)+(r[n+3]<<24)}function t(r,n,f){return r[n]===r[f]&&r[n+1]===r[f+1]&&r[n+2]===r[f+2]&&r[n+3]===r[f+3]}function e(r,n,f,t,e){var o;for(o=0;o<e;o++)f[t+o]=r[n+o]}function o(r,n,f,t,o){return f<=60?(t[o]=f-1<<2,o+=1):f<256?(t[o]=240,t[o+1]=f-1,o+=2):(t[o]=244,t[o+1]=f-1&255,t[o+2]=f-1>>>8,o+=3),e(r,n,t,o,f),o+f}function i(r,n,f,t){return t<12&&f<2048?(r[n]=1+(t-4<<2)+(f>>>8<<5),r[n+1]=255&f,n+2):(r[n]=2+(t-1<<2),r[n+1]=255&f,r[n+2]=f>>>8,n+3)}function _(r,n,f,t){for(;t>=68;)n=i(r,n,f,64),t-=64;return t>64&&(n=i(r,n,f,60),t-=60),i(r,n,f,t)}function a(e,i,a,s,u){for(var $,c,h,p,v,m,x,l,d,y,g,w,b,k=1;1<<k<=a&&k<=14;)k+=1;var T=32-(k-=1);void 0===r[k]&&(r[k]=new Uint16Array(1<<k));var B=r[k];for($=0;$<B.length;$++)B[$]=0;var L=i+a,S=i,C=i,I=!0;if(a>=15)for(c=L-15,i+=1,p=n(f(e,i),T);I;){x=32,v=i;do{if(i=v,h=p,l=x>>>5,x+=1,v=i+l,i>c){I=!1;break}p=n(f(e,v),T),m=S+B[h],B[h]=i-S}while(!t(e,i,m));if(!I)break;u=o(e,C,i-C,s,u);do{for(d=i,y=4;i+y<L&&e[i+y]===e[m+y];)y+=1;if(i+=y,u=_(s,u,g=d-m,y),C=i,i>=c){I=!1;break}B[w=n(f(e,i-1),T)]=i-1-S,b=n(f(e,i),T),m=S+B[b],B[b]=i-S}while(t(e,i,m));if(!I)break;i+=1,p=n(f(e,i),T)}return C<L&&(u=o(e,C,L-C,s,u)),u}function s(r){this.array=r}s.prototype.maxCompressedLength=function(){var r=this.array.length;return 32+r+Math.floor(r/6)},s.prototype.compressToBuffer=function(r){var n,f=this.array,t=f.length,e=0,o=0;for(o=function r(n,f,t){do f[t]=127&n,(n>>>=7)>0&&(f[t]+=128),t+=1;while(n>0);return t}(t,r,o);e<t;)n=Math.min(t-e,65536),o=a(f,e,n,r,o),e+=n;return o};var u=[0,255,65535,16777215,4294967295];function e(r,n,f,t,e){var o;for(o=0;o<e;o++)f[t+o]=r[n+o]}function $(r,n,f,t){var e;for(e=0;e<t;e++)r[n+e]=r[n-f+e]}function c(r){this.array=r,this.pos=0}return c.prototype.readUncompressedLength=function(){for(var r,n,f=0,t=0;t<32&&this.pos<this.array.length&&(r=this.array[this.pos],this.pos+=1,(n=127&r)<<t>>>t===n);){if(f|=n<<t,r<128)return f;t+=7}return -1},c.prototype.uncompressToBuffer=function(r){for(var n,f,t,o,i=this.array,_=i.length,a=this.pos,s=0;a<i.length;)if(n=i[a],a+=1,(3&n)==0){if((f=(n>>>2)+1)>60){if(a+3>=_)return!1;t=f-60,f=((f=i[a]+(i[a+1]<<8)+(i[a+2]<<16)+(i[a+3]<<24))&u[t])+1,a+=t}if(a+f>_)return!1;e(i,a,r,s,f),a+=f,s+=f}else{switch(3&n){case 1:f=(n>>>2&7)+4,o=i[a]+(n>>>5<<8),a+=1;break;case 2:if(a+1>=_)return!1;f=(n>>>2)+1,o=i[a]+(i[a+1]<<8),a+=2;break;case 3:if(a+3>=_)return!1;f=(n>>>2)+1,o=i[a]+(i[a+1]<<8)+(i[a+2]<<16)+(i[a+3]<<24),a+=4}if(0===o||o>s)return!1;$(r,s,o,f),s+=f}return!0},{compress:function r(n){var f,t,e=new s(n),o=e.maxCompressedLength();return f=new Uint8ClampedArray(o),t=e.compressToBuffer(f),f.slice(0,t)},uncompress:function r(n,f){var t,e=new c(n),o=e.readUncompressedLength();if(-1===o)throw Error("Invalid Snappy bitstream");if(o>f)throw Error(`The uncompressed length of ${o} is too big, expect at most ${f}`);if(t=new Uint8ClampedArray(o),!e.uncompressToBuffer(t))throw Error("Invalid Snappy bitstream");return t}}}();

  let cache;

  function imgDataToURL(img, imgData) {
    if ('OffscreenCanvas' in window) {
      const canvas = new OffscreenCanvas(imgData.width, imgData.height);
      const worker = new Worker('jxl_dec.js');
      worker.postMessage({canvas, imgData}, [canvas]);
      worker.addEventListener('message', m => {
        img.style.backgroundImage = 'url("' + m.data.url + '")';
      });
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = imgData.width;
      canvas.height = imgData.height;
      canvas.getContext('2d').putImageData(imgData, 0, 0);
      img.style.backgroundImage = 'url("' + canvas.toDataURL() + '")';
    }
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
      cache = config.useCache && (cache || await caches.open('jxl'));
    } catch (e) {}
    const cachedImg = cache && await cache.match(jxlSrc);
    if (cachedImg) {
      const cachedImgCArray = new Uint8ClampedArray(await cachedImg.arrayBuffer());
      const cachedImgArray = config.compressCache ? SnappyJS.uncompress(cachedImgCArray) : cachedImgCArray;
      const cachedImgData = new ImageData(cachedImgArray, cachedImg.headers.get('width'), cachedImg.headers.get('height'));
      requestAnimationFrame(() => isCSS ? imgDataToURL(img, cachedImgData) : imgDataToCanvas(img, cachedImgData));
      return;
    }
    const res = await fetch(jxlSrc);
    const image = await res.arrayBuffer();
    const worker = new Worker('jxl_dec.js');
    worker.postMessage({jxlSrc, image}, [image]);
    worker.addEventListener('message', m => {
      const imgData = m.data.imgData;
      requestAnimationFrame(() => isCSS ? imgDataToURL(img, imgData) : imgDataToCanvas(img, imgData));
      if (config.useCache) {
        const imgArray = config.compressCache ? SnappyJS.compress(imgData.data) : imgData.data;
        cache && cache.put(jxlSrc, new Response(imgArray, {headers: {'content-type': 'image/jxl', width: imgData.width, height: imgData.height}}));
      }
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
