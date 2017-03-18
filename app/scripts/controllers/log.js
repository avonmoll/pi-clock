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
    $scope.logfile = "";
    $scope.download = function() {
      // TODO: do the download here
      $http({method: 'GET', url: '/downloadLog'}).
        then(function(response) {
          var anchor = angular.element('<a/>');
          anchor.attr({
            href: 'data:attachment/text;charset=utf-8,' + encodeURI(response.data),
            target: '_blank',
            download: 'out.log'
        })[0].click();
      })
    };
    $http.get('/downloadLog')
      .then(function(response){
        console.log('log downloaded');
        var log = response.data; //.replace(/(?:\r\n|\r|\n)/g, '<br />');
        $scope.logFile = log;
      }, function(){});  
  });
