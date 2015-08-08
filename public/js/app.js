angular.module('betmaster', ['ui.bootstrap'])
    .controller('FetchListCtrl', function ($http) {
        var that = this;
        that.loading = false;

        that.fetchData = function () {
            that.data = null;
            that.loading = true;

            $http.get('/api/data').then(function(response) {
                that.data = response.data;
            }).finally(function () {
                that.loading = false;
            });
        }
    });
