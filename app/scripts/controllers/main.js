'use strict';

/**
 * @ngdoc function
 * @name piClockApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the piClockApp
 */
angular.module('piClockApp')
  .controller('MainCtrl', function ($scope, $http) {
      $scope.showAlert = false;
      $scope.form = {};
      $scope.alertMsg = '';
      $http.get('/config')
        .then(function(result) {
          $scope.form = result.data;
        });
      $scope.saveSettings = function() {
        $http.post('/config', $scope.form)
          .then(function(result) {
            $scope.showAlert = true;
            $scope.alertMsg = result.data;
            setTimeout(function() {
              $scope.showAlert = false;
              $scope.$apply();
            }, 2000);
          });
      };
      $scope.resetSettings = function() {
        $http.get('/configreset')
          .then(function(result) {
            console.log('configreset: ');
            console.log(result.data);
            $scope.form = result.data;
          }, function(err) {
            throw(err);
          })
      }
    });
