# JXL.js

This is a JPEG XL decoder in JavaScript using WebAssembly implementatin from the [Squoosh](https://github.com/GoogleChromeLabs/squoosh) app. 

## Usage

Just insert your JPEG XL images to your HTML document as usual: `<img src="image.jxl" alt="...">` and append JXL.js script to the `<head>` of your web page:

`<script src="jxl.js"></script>`

JXL.js uses Mutation Observer to watch for `<img>` elements added to the DOM and it decodes them as they appear using WebAssembly JPEG XL decoder in Web Workers.

[See the demo](https://niutech.github.io/jxl.js/)

## To do

- `<picture>` HTML element
- `background-image` CSS property
- performance improvements

## License

&copy; 2022 Jerzy Głowacki and Squoosh Developers under Apache 2.0 License.