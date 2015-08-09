var express = require('express');
var app = express();
var Xray = require('x-ray');
var _ = require('lodash');
var moment = require('moment');
var bodyParser = require('body-parser')

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser());
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    response.render('pages/index');
});

app.post('/api/data', function(request, response) {
    var x = Xray(),
        requestedDate = moment(request.body.date);

    x('http://www.betexplorer.com/soccer/england/premier-league-2014-2015/results/',
        'table.league-results tr', [{
            'round': 'th.first-cell',
            'match': 'td.first-cell',
            'date': 'td.last-cell'
    }])(function (err, arr) {
        var result = [],
            round = 0,
            maxRound = 0,
            minDate;
        arr.forEach(function (v) {
            if (v.round) {
                round = parseInt(v.round, 10);
            } else {
                result.push({
                    'round': round,
                    'match': v.match,
                    'date': moment(v.date, 'DD.MM.YYYY'),
                    'dateStr': v.date
                });
            }
        });

        // Get highest round number.
        maxRound = _.max(result, 'round').round;

        // Get min date.
        minDate = _.min(_.filter(result, function(i) {
            return i.round > maxRound - 5;
        }), 'date').date;

        // Get matches after min date.
        prevSeason = _.filter(result, function (i) {
            return i.date >= minDate;
        });

        // Now get current season.
        result = [];
        x('http://www.betexplorer.com/soccer/england/premier-league/fixtures/',
            'table.league-fixtures tr', [{
                //TODO: Right selector.
                'match': 'td.nobr',
                'dateStr': 'td.date'
            }])(function (err, arr) {

            result = _.filter(arr, function (i) {
                return _.isString(i.dateStr) && (i.dateStr.length >= 10);
            });

            result = _.map(result, function (i) {
                i.dateTrunc = i.dateStr.substr(0, 10);
                i.date = moment(i.dateTrunc, 'DD.MM.YYYY');
                return i;
            });

            // Filter today matches.
            result = _.filter(result, function (i) {
                return i.date.isSame(requestedDate);
            });

            // Add previous season results.
            result = _.map(result, function (i) {

                // Get same matches.
                i.prev = _.filter(prevSeason, function (p) {
                    return p.match === i.match;
                });
                return i;
            });

            // Remove matches without prev season.
            result = _.filter(result, function (i) {
                return (i.prev.length > 0);
            });

            response.json(result);
        });
    });
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
