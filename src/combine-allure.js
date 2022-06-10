/* eslint-disable no-restricted-syntax */
/**
 * Allure static files combiner for Node
 * Originally written in python by MihanEntalpo: https://github.com/MihanEntalpo/allure-single-html-file
 *
 * Create single html files with all the allure report data, that can be opened from everywhere.
 *
 * Example:
 *    node ./combine.js ../allure_gen
 */

 const fs = require('fs');
 const glob = require('glob');
 const { sep, resolve } = require('path');
 const JSSoup = require('jssoup').default;
 
 const combineAllure = (folder) => {
 /**
  * Read all files,
  * create server.js,
  * then run server.js,
  */
 
   const cwd = __dirname;
 
   console.log(`> Folder to process is ${folder}; cwd is ${cwd}`);
   console.log('> Checking for folder contents');
 
   const filesShouldBe = ['index.html', 'app.js', 'styles.css'];
 
   for (const file of filesShouldBe) {
     if (!fs.existsSync(`${folder}/${file}`)) {
       throw new Error(`ERROR: file ${folder}/${file} doesnt exists, but it should!`);
     }
   }
 
   const defaultContentType = 'text/plain;charset=UTF-8';
 
   const contentType = {
     svg: 'image/svg',
     txt: 'text/plain;charset=UTF-8',
     js: 'application/javascript',
     json: 'application/json',
     csv: 'text/csv',
     css: 'text/css',
     html: 'text/html',
     htm: 'text/html',
     png: 'image/png',
     jpeg: 'image/jpeg',
     jpg: 'image/jpg',
     gif: 'image/gif',
   };
 
   const base64Extensions = ['png', 'jpeg', 'jpg', 'gif', 'html', 'htm'];
 
   const allowedExtensions = Object.keys(contentType);
 
   const data = [];
 
   console.log('> Scanning folder for data files...');
 
   const files = glob.sync(`${folder}/**/*.{${allowedExtensions.join(',')}}`);
 
   for (const file of files) {
     const ext = file.split('.').at(-1);
     const mime = contentType[ext] || defaultContentType;
     let content;
 
     if (base64Extensions.includes(ext)) {
       content = fs.readFileSync(file, 'base64');
     } else {
       content = fs.readFileSync(file, 'utf-8');
     }
 
     console.log(`>>> file: ${file}`);
     const fileUrl = `${file.replace(new RegExp(`^${folder}`), '')}`.replace(/^\//g, '');
     console.log(`>>> fileUrl: ${fileUrl}`);
 
     data.push({
       url: fileUrl,
       mime,
       content,
       base64: base64Extensions.includes(ext),
     });
   }
 
   console.log(`Found ${data.length} data files`);
   console.log('> Building server.js file...');
 
   fs.writeFileSync(`${folder}/server.js`, `
       function _base64ToArrayBuffer(base64) {
           var binary_string = window.atob(base64);
           var len = binary_string.length;
           var bytes = new Uint8Array(len);
           for (var i = 0; i < len; i++) {
               bytes[i] = binary_string.charCodeAt(i);
           }
           return bytes.buffer;
       }
 
       function _arrayBufferToBase64( buffer ) {
         var binary = '';
         var bytes = new Uint8Array( buffer );
         var len = bytes.byteLength;
         for (var i = 0; i < len; i++) {
           binary += String.fromCharCode( bytes[ i ] );
         }
         return window.btoa( binary );
       }
 
       document.addEventListener("DOMContentLoaded", function() {
           var old_prefilter = jQuery.htmlPrefilter;
 
           jQuery.htmlPrefilter = function(v) {
               var regs = [
                   /<a[^>]*href="(?<url>[^"]*)"[^>]*>/,
                   /<img[^>]*src="(?<url>[^"]*)"\\/?>/
               ];
 
               for (i in regs)
               {
                   reg = regs[i];
                   m = reg.exec(v);
                   if (m)
                   {
                       if (m['groups'] && m['groups']['url'])
                       {
                           var url = m['groups']['url'];
                           if (server_data.hasOwnProperty(url))
                           {
                               v = v.replace(url, server_data[url]);
                           }
                       }
                   }
               }
 
               return old_prefilter(v);
           };
       });
   `);
 
   fs.appendFileSync(`${folder}/server.js`, 'var server_data={\n');
   for (const d of data) {
     let content;
     if (d.base64) {
       content = `data: ${d.mime};base64, ${d.content}`;
     } else {
       content = `${d.content.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\r\n', '\\n').replaceAll('\n', '\\n')
         .replaceAll('<', '&lt;')
         .replaceAll('>', '&gt;')}`;
     }
     fs.appendFileSync(`${folder}/server.js`, `"${d.url.replaceAll(sep, '/')}": "${content}", \n`);
   }
   fs.appendFileSync(`${folder}/server.js`, '};\n');
 
   fs.appendFileSync(`${folder}/server.js`, '    var server = sinon.fakeServer.create();\n');
 
   for (const d of data) {
     const fileContentType = d.mime;
     const url = d.url.replaceAll(sep, '/');
     fs.appendFileSync(`${folder}/server.js`, `
       server.respondWith("GET", "${url}", [
           200, { "Content-Type": "${fileContentType}" }, server_data["${url}"],
         ]);`);
   }
   fs.appendFileSync(`${folder}/server.js`, 'server.autoRespond = true;');
 
   const { size: serverFileSize } = fs.statSync(`${folder}${sep}server.js`);
   console.log(`server.js is built, it's size is: ${serverFileSize} bytes`);
 
   console.log('> Copying file sinon-9.2.4.js into folder...');
   fs.copyFileSync(`${__dirname}${sep}sinon-9.2.4.js`, `${folder}${sep}sinon-9.2.4.js`);
   console.log('sinon-9.2.4.js is copied');
 
   console.log('> Reading index.html file');
   let indexHtml = fs.readFileSync(`${folder}${sep}index.html`, 'utf8');
 
   if (!/sinon-9.2.4.js/.test(indexHtml)) {
     console.log('> Patching index.html file to make it use sinon-9.2.4.js and server.js');
     indexHtml = indexHtml.replace(
       '<script src="app.js"></script>',
       '<script src="sinon-9.2.4.js"></script><script src="server.js"></script><script src="app.js"></script>',
     );
 
     console.log('> Saving patched index.html file, so It can be opened without --allow-file-access-from-files');
     fs.writeFileSync(`${folder}${sep}index.html`, indexHtml);
     console.log('done');
   } else {
     console.log("> Skipping patching of index.html as it's already patched");
   }
 
   console.log('> Parsing index.html');
   const soup = new JSSoup(indexHtml);
 
   console.log('> Filling script tags with real files contents');
   for (const tag of soup.findAll('script')) {
     const filePath = `${folder}${sep}${tag.attrs.src}`;
     console.log('...', tag.toString(), filePath);
 
     const ff = fs.readFileSync(filePath, 'utf8');
     const fullScriptTag = new JSSoup(`<script>${ff}</script>`);
     tag.replaceWith(fullScriptTag);
   }
   console.log('Done');
 
   console.log('> Replacing link tags with style tags with real file contents');
   for (const tag of soup.findAll('link')) {
     if (tag.attrs.rel === 'stylesheet') {
       const filePath = `${folder}${sep}${tag.attrs.href}`;
       console.log('...', tag.toString(), filePath);
 
       const ff = fs.readFileSync(filePath, 'utf8');
       const fullScriptTag = new JSSoup(`<style>${ff}</style>`);
       tag.replaceWith(fullScriptTag);
     }
   }
   console.log('Done');
 
   fs.writeFileSync(`${folder}${sep}complete.html`, soup.toString());
 
   console.log(`> Saving result as ${folder}${sep}complete.html`);
 
   const { size: completeFileSize } = fs.statSync(`${folder}${sep}complete.html`);
   console.log(`Done. Complete file size is: ${completeFileSize} bytes`);
 };
 
 module.exports = {
   combineAllure,
 };