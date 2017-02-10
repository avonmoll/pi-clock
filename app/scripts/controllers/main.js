'use strict';

/**
 * @ngdoc function
 * @name mod2LabApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the mod2LabApp
 */
angular.module('mod2LabApp')
  .controller('MainCtrl', function ($scope, $http) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    this.message = "Hello";
    $http.get("welcome")
    .then(function(response) {
      $scope.message = response.data;
      // this.message = response.data;
      // console.log(response.data);
    });
  });
