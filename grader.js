#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio'); //jquery parsing html
var rest = require('restler');

var HTMLFILE_DEFAULT = "index.html";

var HTMLURL_DEFAULT = "http://shrouded-crag-6793.herokuapp.com";
var HTMLURLFILE_DEFAULT = "url_file_defualt.html";

var CHECKSFILE_DEFAULT = "checks.json";



//check existence 
var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};


//assert or validate the url and write the url into disk if it is valid
//then try to check the html tags
var assertURLValid = function(infile) {
    var instr = infile.toString();
    rest.get(instr).on('complete', function(result, response) {
        //if(result instanceof Error) {
        if (response.statusCode == 400) {
            console.error('Error: 400 Bad Request!'); 
            process.exit(1);
        }
        else {
            fs.writeFileSync(HTMLURLFILE_DEFAULT, result);
            check_wrapper(HTMLURLFILE_DEFAULT, program.checks); //because program is globally accessible
        }
    });
    return instr;
};

//load html
var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

//load checks
var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var check_wrapper = function(filename, checkfilename) {
    var checkJson = checkHtmlFile(filename, checkfilename); //argv stored at program.file, program.checks
    var outJson = JSON.stringify(checkJson, null, 4); //format json
    console.log(outJson);
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
        .option('-u, --url <html_url>', 'url to index.html', clone(assertURLValid))
        .parse(process.argv);

    //(1) assume only one of -f or -u could be specifed
    //    if can be here, then url and file are all valid
    // 
    //(2) assume the defualt file and url are exist or valid
    //    
    //(3) if -f or -u or -c are specified as invalid number, then it would safely existing
    //    but if the default file or url is not exist or valid, there would be unhandled exception or error!
    //if(program.url) {
    //    processURL(program.url, program.checks);
    //}
    if(program.file) {
        check_wrapper(program.file, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
