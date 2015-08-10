angular.module('betmaster', ['ui.bootstrap'])
    .controller('FetchListCtrl', function ($http) {
        var that = this;
        that.loading = false;
        that.dt = new Date(moment().tz('Europe/Moscow').startOf('day').format('YYYY-MM-DD'));

        that.fetchData = function () {
            that.data = null;
            that.loading = true;
            $http({
                url: '/api/data',
                method: "POST",
                data: {'date': moment(that.dt).format('YYYY-MM-DD')}
            }).then(function(response) {
                that.data = response.data;
            }).finally(function () {
                that.loading = false;
            });
        }
    });
