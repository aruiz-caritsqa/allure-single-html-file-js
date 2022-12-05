# Allure single html file builder for JS

Tool to build allure generated folder into a single html file.
Ported over from the Python repo [allure-single-html-file](https://github.com/MihanEntalpo/allure-single-html-file) by [MihanEntalpo](https://github.com/MihanEntalpo)

## What it's doing?

1. Attempts to port over functionality in Python from [allure-single-html-file](https://github.com/MihanEntalpo/allure-single-html-file)
2. Reads contents of allure-generated folder
3. Creates server.js file, which has all the data files inside and code to start fake XHR server
4. Patches index.html file, so it's using server.js and sinon-9.2.4.js (Taken from [here](https://sinonjs.org/)), and could be run in any browser without --allow-file-access-from-files parameter of chrome browser
5. Creates file complete.html with all files built-in in a single file

## Requirements

* Node (v16+)
* You need to have your allure report folder generated (`allure generate './some/path/to/allure/generated/folder'`)

## Installation

```bash
npm install allure-single-html-file-js
```

## Run as console script

```bash
node ./node_modules/allure-single-html-file-js/combine.js ./some/path/to/allure/generated/folder
```

## Options

### ALLURE_REPORT_SANITIZE_ANGLE_BRACKETS
If you set this environment variable to any value, then any angled brackets that appear in the content of the Allure Report (i.e "<" or ">") will be sanitized to "&lt;" or "&gt;"

If you don't add this environment variable, then the angled brackets won't be sanitized.

```bash
ALLURE_REPORT_SANITIZE_ANGLE_BRACKETS=1 node ./node_modules/allure-single-html-file-js/combine.js ./some/path/to/allure/generated/folder
```


## TODO

* Keep up-to-date with [allure-single-html-file](https://github.com/MihanEntalpo/allure-single-html-file) changes
* Add some more tests