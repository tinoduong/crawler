var express = require('express'), 
    app = express.createServer(), 
    path = require('path'),
    fs = require('fs'),
    IMAGE_DIR = path.join(__dirname, 'images'),
    JS_DIR = path.join(__dirname, 'static'),
    PORT = 8081;

app.use(express.bodyParser());

app.get('/image', function(req, res) {
    var files = fs.readdirSync(IMAGE_DIR).filter(function (f) { return /\.jpg$/.test(f); });
    return res.json(files);
});

app.get('/:image/metadata', function (req, res) {
    var imageName = req.params.image;

    fs.readFile(path.join(IMAGE_DIR, imageName + '.json'), 'utf8', function (err, data) {
        if (err && err.code === 'ENOENT') {
            return res.json({}, 200);
        }
        if (err) { 
            console.log(err);
            return res.send('There was an error', { 'Content-type': 'text/plain' }, 500);    
        }

        return res.json(JSON.parse(data), 200);
    });
});

app.put('/:image/metadata', function (req, res) {
    var imageName = req.params.image, data = req.body;

    fs.writeFile(path.join(IMAGE_DIR, imageName + '.json'), JSON.stringify(data), 'utf8', function (err) {
        if (err) {
            console.log(err);
            return res.send('There was an error saving.', { 'Content-type': 'text/plain' }, 500);
        } 

        return res.send('OK', {'Content-type': 'text/plain'}, 200);
    }); 
});

app.use(express.static(IMAGE_DIR));
app.use(express.static(JS_DIR));
app.use(app.router);


app.listen(PORT);
