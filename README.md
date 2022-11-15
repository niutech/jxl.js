# JXL.js

This is a JPEG XL decoder in JavaScript using WebAssembly implementation from the [Squoosh](https://github.com/GoogleChromeLabs/squoosh) app running in Web Worker.

## Usage

Just insert your JPEG XL images to your HTML document as usual: `<img src="image.jxl" alt="..." width="..." height="...">` and append JXL.js script to the `<head>` of your web page:

`<script src="jxl.js"></script>`

JXL.js uses Mutation Observer to watch for `<img>` tags being added to the DOM and it decodes them as they appear using WebAssembly decoder in Web Worker.

#### [See the demo](https://niutech.github.io/jxl.js/)

## To do

- `<picture>` HTML element
- `background-image` CSS property
- performance improvements
- image caching

## License

&copy; 2022 Jerzy Głowacki and Squoosh Developers under Apache 2.0 License.