angular.module('betmaster', ['ui.bootstrap'])
    .controller('FetchListCtrl', function ($http) {
        var that = this;
        that.loading = false;
        that.dt = new Date(moment().tz('Europe/Moscow').startOf('day').format('YYYY-MM-DD'));
        that.data = [];

        that.leaguesPrefix = 'http://www.betexplorer.com';
        that.leagues = [
            {
                results: '/soccer/england/premier-league-2014-2015/results/',
                fixtures: '/soccer/england/premier-league/fixtures/',
                name: 'England Premier League',
                resultsFrom: '25.04.2015'
            },
            {
                results: '/soccer/england/championship-2014-2015/results/',
                fixtures: '/soccer/england/championship/fixtures/',
                name: 'England Championship',
                resultsFrom: '10.04.2015'
            },
            {
                results : '/soccer/france/ligue-1-2014-2015/results/',
                fixtures : '/soccer/france/ligue-1/fixtures/',
                name : 'France Ligue 1',
                resultsFrom : '17.04.2015'
            },
            {
                results : '/soccer/france/ligue-2-2014-2015/results/',
                fixtures : '/soccer/france/ligue-2/fixtures/',
                name : 'France Ligue 2',
                resultsFrom : '24.04.2015'
            },
            {
                results : '/soccer/france/national-2014-2015/results/',
                fixtures : '/soccer/france/national/fixtures/',
                name : 'France National',
                resultsFrom : '17.04.2015'
            },
            {
                results : '/soccer/italy/serie-a-2014-2015/results/',
                fixtures : '/soccer/italy/serie-a/fixtures/',
                name : 'Italy Serie-A',
                resultsFrom : '28.04.2015'
            },
            {
                results : '/soccer/spain/primera-division-2014-2015/results/',
                fixtures : '/soccer/spain/primera-division/fixtures/',
                name : 'Spain Primera Division',
                resultsFrom : '24.04.2015'
            },
            {
                results : '/soccer/spain/segunda-division-2014-2015/results/',
                fixtures : '/soccer/spain/segunda-division/fixtures/',
                name : 'Spain Segunda Division',
                resultsFrom : '09.05.2015'
            },
            {
                results : '/soccer/germany/bundesliga-2014-2015/results/',
                fixtures : '/soccer/germany/bundesliga/fixtures/',
                name : 'Germany Bundesliga',
                resultsFrom : '24.04.2015'
            },
            {
                results : '/soccer/germany/2-bundesliga-2014-2015/results/',
                fixtures : '/soccer/germany/2-bundesliga/fixtures/',
                name : 'Germany 2 Bundesliga',
                resultsFrom : '24.04.2015'
            },
            {
                results : '/soccer/germany/3-liga-2014-2015/results/',
                fixtures : '/soccer/germany/3-liga/fixtures/',
                name : 'Germany 3 Liga',
                resultsFrom : '24.04.2015'
            }
        ];

        that.fetchLeague = function (leagueIndex) {
            var league = that.leagues[leagueIndex];
            if (league) {
                that.message = 'Обработка ' + league.name;

                $http({
                    url: '/api/data',
                    method: "POST",
                    data: {
                        'date': moment(that.dt).format('YYYY-MM-DD'),
                        'results': that.leaguesPrefix + league.results,
                        'fixtures': that.leaguesPrefix + league.fixtures,
                        'resultsFrom': league.resultsFrom
                    }
                }).then(function(response) {
                    that.data = that.data.concat(response.data);
                }).catch(function () {
                    that.message = 'Ошибка';
                }).finally(function () {
                    that.fetchLeague(leagueIndex + 1);
                });

            } else {
                that.loading = false;
                that.message = 'Запрос завершен';
            }
        };

        that.fetchData = function () {
            that.data = [];
            that.loading = true;
            that.fetchLeague(0);
        }
    });
