'use strict';

/**
 * @ngdoc function
 * @name mod2LabApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the mod2LabApp
 */
angular.module('mod2LabApp')
  .controller('AboutCtrl', function($scope, $http) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    $scope.sendToServer = function() {
      console.log("Line 18");
      $http.post("/", {
          color: $scope.color
        })
        .then(function(response) {
          $scope.serverMessage = response.data;
        });
      setTimeout(function() {
        $scope.serverMessage = "";
        $scope.$apply();
        console.log("got " + $scope.color);
        console.log("turned server message off");
      }, 2000);

    };
  });
