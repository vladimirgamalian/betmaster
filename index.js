var express = require('express');
var app = express();
var Xray = require('x-ray');
var phantom = require('x-ray-phantom');
var requestModule = require('request');
var cheerio = require('cheerio');
var jar = requestModule.jar();

var _ = require('lodash');
var moment = require('moment-timezone');
var bodyParser = require('body-parser');

var serverTz = 'Asia/Bangkok';
var moscowTz = 'Europe/Moscow';
var betExplorerUri = 'http://www.betexplorer.com';
var prevSeasonUrl = 'http://www.betexplorer.com/soccer/england/premier-league-2014-2015/results/';
var curSeasonUrl = 'http://www.betexplorer.com/soccer/england/premier-league/fixtures/';

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
        result = {},
        tzOffset = 3,   // Moscow GMT+3
        requestedDate = moment.tz(request.body.date, moscowTz);

    console.log('requestedDate', requestedDate.format());

    // Convert DD.MM.YYYY to YYYY-MM-DD
    function convertDate(s) {
        return s.substr(6, 4) + '-' + s.substr(3, 2) + '-' + s.substr(0, 2);
    }

    // Convert DD.MM.YYYY hh:mm to YYYY-MM-DDThh:mm+03:00
    function convertDateTime(s) {
        return s.substr(6, 4) + '-' + s.substr(3, 2) + '-' + s.substr(0, 2) + 'T' + s.substr(11, 2) + ':' + s.substr(14, 2) + '+03:00';
    }

    function tzOffsetToStr(v) {
        if (v < 0) {
            return v.toString();
        }
        return '+' + v.toString();
    }

    jar.setCookie(requestModule.cookie('my_timezone=' + tzOffsetToStr(tzOffset)), betExplorerUri);
    requestModule({uri: prevSeasonUrl, jar: jar}, function (error, resp, html) {
        var prevSeasonMatches = [],
            currentRound = 0,
            maxRound,
            minDate;

        if (!error && resp.statusCode == 200) {
            var $ = cheerio.load(html),
                siteTzSelector = $('#tz-switch a').text(),
                realTzOffset = parseInt(siteTzSelector.match(/[^+-]*(.\d{1,2})/)[1], 10);

            if (tzOffset != realTzOffset) {
                console.log('WARNING', tzOffset, realTzOffset);
            }

            // Get previous league matches.
            $('table.league-results tr').each(function (i, elem) {
                var round = $(this).find('th.first-cell').text(),
                    match = $(this).find('td.first-cell').text(),
                    date = $(this).find('td.last-cell').text();
                if (round) {
                    currentRound = parseInt(round, 10);
                } else {
                    prevSeasonMatches.push({
                        match: match,
                        date: moment.tz(convertDate(date), moscowTz),
                        round: currentRound
                    });
                }
            });

            // Get highest round number.
            maxRound = _.max(prevSeasonMatches, 'round').round;

            // Get min date.
            minDate = _.min(_.filter(prevSeasonMatches, function(i) {
                return i.round > maxRound - 5;
            }), 'date').date;

            // Get matches after min date.
            prevSeasonMatches = _.filter(prevSeasonMatches, function (i) {
                return i.date >= minDate;
            });

            // Now get current season.
            requestModule({uri: curSeasonUrl, jar: jar}, function (error, resp, html) {
                var currSeasonMatches = [];

                if (!error && resp.statusCode == 200) {
                    var $ = cheerio.load(html),
                        siteTzSelector = $('#tz-switch a').text(),
                        realTzOffset = parseInt(siteTzSelector.match(/[^+-]*(.\d{1,2})/)[1], 10);

                    if (tzOffset != realTzOffset) {
                        console.log('WARNING', tzOffset, realTzOffset);
                    }


                    $('table.league-fixtures tr').each(function (i, elem) {
                        var round = $(this).find('th.first-cell').text(),
                            match = $(this).find('td.nobr').text(),
                            date = $(this).find('td.first-cell').text();
                        if (round) {
                            currentRound = parseInt(round, 10);
                        } else {
                            if (date.length >= 10) {
                                currSeasonMatches.push({
                                    match: match,
                                    date: moment.tz(convertDateTime(date), moscowTz),
                                    round: currentRound
                                });
                            }
                        }
                    });

                    // Filter today matches.
                    currSeasonMatches = _.filter(currSeasonMatches, function (i) {
                        return i.date.startOf('day').isSame(requestedDate);
                    });

                    // Add previous season results.
                    currSeasonMatches = _.map(currSeasonMatches, function (i) {

                        // Get same matches.
                        i.prev = _.filter(prevSeasonMatches, function (p) {
                            return p.match === i.match;
                        });
                        return i;
                    });

                    // Remove matches without prev season.
                    currSeasonMatches = _.filter(currSeasonMatches, function (i) {
                        return (i.prev.length > 0);
                    });

                    // Format result.
                    currSeasonMatches = _.map(currSeasonMatches, function (i) {

                        // Get same matches.
                        i.prevDates = _.map(i.prev, function (p) {
                            return p.date.format('DD.MM.YYYY');
                        }).join();

                        return i;
                    });


                    response.json(currSeasonMatches);
                } else {
                    result.error = error;
                    result.statusCode = resp.statusCode;
                    response.json(result);
                }
            });
        } else {
            result.error = error;
            result.statusCode = resp.statusCode;
            response.json(result);
        }
    });
});


app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
