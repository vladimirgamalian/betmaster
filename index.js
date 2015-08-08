var express = require('express');
var app = express();
var Xray = require('x-ray');

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    response.render('pages/index');
});

app.get('/api/data', function(request, response) {
    var x = Xray();
    x('http://www.betexplorer.com/soccer/', ['a.cal'])(function (err, arr) {
        response.json(arr);
    });
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
