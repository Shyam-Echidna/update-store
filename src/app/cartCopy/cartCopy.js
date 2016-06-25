angular.module( 'orderCloud')

	.config( CartCopyConfig )
	.controller( 'CartCopyCtrl', CartCopyController )
;

function CartCopyConfig( $stateProvider ) {
	$stateProvider
		.state( 'cartCopy', {
			parent: 'base',
			url: '/cartCopy',
			templateUrl: 'cartCopy/templates/cartCopy.tpl.html',
			controller: 'CartCopyCtrl',
			controllerAs: 'cartCopy',
	 resolve: {
  

   }
		})
}
function CartCopyController( $scope, $window, HomeFact, PlpService, $q, $sce, alfcontenturl, CategoryService, Underscore, $rootScope) {

	var vm = this;
	setTimeout(function(){
      	var owl2 = angular.element("#owl-carousel-cart");	
		owl2.owlCarousel({
			//responsive: true,
			loop:true,
			nav:true,
			responsive:{
				0:{ items:1 },
				320:{
					items:2,
				},
				730 :{ 
					items:3,
				},
				1024:{ 
					items:4
				}
			}
		});
		},1000)

	
    /*$scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };*/

}