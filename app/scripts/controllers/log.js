'use strict';

/**
 * @ngdoc function
 * @name piClockApp.controller:LogCtrl
 * @description
 * # LogCtrl
 * Controller of the piClockApp
 */
angular.module('piClockApp')
  .controller('LogCtrl', function($scope, $http) {
    $scope.download = function() {
      // TODO: do the download here
      $http.get('/downloadLog')
        .then(function(response){
          console.log(response.data);
          $scope.logFile = response.data;
        }, function(){});
    };
    $scope.logfile = "";
  });
