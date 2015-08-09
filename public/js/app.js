angular.module('betmaster', ['ui.bootstrap'])
    .controller('FetchListCtrl', function ($http) {
        var that = this;
        that.loading = false;
        that.dt = moment().startOf('day');

        that.fetchData = function () {
            that.data = null;
            that.loading = true;

            $http({
                url: '/api/data',
                method: "POST",
                data: {'date': that.dt}
            }).then(function(response) {
                that.data = response.data;
            }).finally(function () {
                that.loading = false;
            });
        }
    });
