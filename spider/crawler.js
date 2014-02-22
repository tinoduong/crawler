/**
 * Generic web crawler to scrape all images
 * @type {*}
 */

var http   = require('http'),
    events = require('events'),
    _      = require("/usr/local/lib/node_modules/underscore"),
    fs     = require("fs"),
    async  = require("/usr/local/lib/node_modules/async"),
    jsdom  = require("/usr/local/lib/node_modules/jsdom"),
    eventEmitter = new events.EventEmitter();


// URL PARAMETERS HERE ---
var baseDomain  = "www.huffingtonpost.com";          //base domain of the site you're scraping
var subPath        = "";
var baseUrl     = "http://" + baseDomain + subPath;
//var ignoreList  = ["static.squarespace.com"];  //domains spider can crawl to other than base domain
var ignoreList = [];

var queue       = [];
var visited     = {};
var IMAGE_INDEX = 0;

visited[baseDomain] = true;


/**
 * From the link src, find the name in the url
 * if none exists, make one up
 *
 * @param link
 * @returns {*}
 */
function extractName(link) {

    var regex   = /(([\w\d\-]*)\.(jpg|jpeg|gif|tiff|png|JPEG|JPG|GIF|TIFF|PNG))/,
        results = regex.exec(link);

    if (results) {
        return results[0];
    }

    return "A" + IMAGE_INDEX++;
}

/**
 *
 * returns the address broken into a) protocol,
 * b) domain, c) path
 * @param address
 */
function parseAddress(address, isBinary) {

    var patt    = /(http:\/\/|https:\/\/)*([\w\d\.\-]+(\.com))*(\/.*)*/g,
        results = patt.exec(address),
        toRet   = {};

    //make sure there is an address
    if (!address || !results) { return null;}

    toRet.address  = address;
    toRet.protocol = results[1] || "http://";
    toRet.domain   = results[2] || baseDomain;
    toRet.path     = results[4] ||  "";

    //restrict links to this domain, unless it's an image
    if (toRet.domain !== baseDomain && !isBinary) { return null;}

    return toRet;
}

/**
 * Perform a Get request and return the html
 *
 * @param address
 * @param isBinary
 * @param cb
 */
function getRequest(address, isBinary, cb) {

    var params   =  parseAddress(address, isBinary),
        binary   = !!isBinary,
        options;

    if (!params) { return cb("Invalid address: " + address); }

    options = { host: params.domain, path: params.path};

    function onDone (response) {

        var str = "";

        if (isBinary) {
            response.setEncoding('binary');
        }

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) { str += chunk; });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () { cb(null, str); });

        response.on('error', function () {
            cb("unable to hit site ", address)
        });

    }

    console.log("\t Http Request ----> ", params.address);

    var req = http.request(options, onDone);

    req.on("error", function() { cb("Request error"); });

    req.end();

}

/**
 * From the html document, find all links
 * and add to queue, only if we haven't seen
 * it already
 *
 * @param $
 */
function getLinks ($) {

    $("a").each(function(index, value) {

        var link = $(value).attr("href");

        //we we haven't seen it add to queue
        if (link && !visited[link]) {

            queue.push(link);
            visited[link] = true;
            eventEmitter.emit("newLink");
        }

    });
}

/**
 * Download images from the html document
 *
 * @param $
 */
function getImages ($) {

    $("img").each(function(index, value) {

        var src  = $(value).attr("src"),
            name;

        if (src && !visited[src]) {

            console.log("Retreiving image: ", src);

            visited[src] = true;
            name = extractName(src);
            getRequest(src, true, function (error, file) {
                fs.writeFile("./images/" + name, file, 'binary', function (err) {
                    if (err) { console.log(err) }
                });
            })

        }

    })

}

/**
 *  This function processes a link from the queue.
 *
 *  - It will find all links within the page and
 *    add it to the queue
 *
 *  - It will download all images from the page
 *
 */
function processLink() {

    var self    = this,
        address = queue.length > 0 ? queue.splice(0,1)[0] : undefined;

    console.log("Processing: ", address);
    async.waterfall([

        _.bind(getRequest, self, address, false),

        function processData (html, cb) {

            try {

                jsdom.env(html,
                    ["http://code.jquery.com/jquery.js"],
                    function(errors, window) {

                        var $ = window ? window.$ : undefined;

                        //Sanity check, if unable to parse html
                        if (!$) { return cb(null);}

                        //1. Find all links in page and add to our list -------
                        getLinks($);

                        //2. Find all images in the page and download it -------
                        getImages($);
                    });

            } catch (e) {
                cb("Invalid html document passed in")
            }


        }], function (err) {

            if(err) { return console.log('\t ( ' + err + " )"); }
    });

}


eventEmitter.on("newLink", processLink);


function main(rootAddress) {

    queue.push(rootAddress);
    processLink();

}



main(baseUrl);



