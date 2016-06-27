angular.module( 'orderCloud' )

    .config( BaseConfig )
.factory( 'BaseService', BaseService)
    .controller( 'BaseCtrl', BaseController )
  //  .controller( 'BaseLeftCtrl', BaseLeftController )
    .controller( 'BaseTopCtrl', BaseTopController )
	.controller( 'BaseDownCtrl', BaseDownController )
    .factory('LoginFact', LoginFact )
	.directive('windowHeight', windowHeightDirective)
	.directive('contTopPadding', contTopPaddingDirective)
	.directive('scroll', scrollDirective)
  .directive('phoneValidation',phoneValidationDirective)
;

function BaseConfig( $stateProvider ) {
    $stateProvider
        .state( 'base', {
            url: '',
            abstract: true,
            templateUrl:'base/templates/base.tpl.html',
            views: {
                '': {
                    templateUrl: 'base/templates/base.tpl.html',
                    controller: 'BaseCtrl',
                    controllerAs: 'base'
                },
                'top@base': {
                    templateUrl: 'base/templates/base.top.tpl.html',
                    controller: 'BaseTopCtrl',
                    controllerAs: 'baseTop'
                },
                /*'left@base': {
                    templateUrl: 'base/templates/base.left.tpl.html',
                    controller: 'BaseLeftCtrl',
                    controllerAs: 'baseLeft'
                },*/
                 'down@base': {
                    templateUrl: 'base/templates/base.down.tpl.html',
                    controller: 'BaseDownCtrl',
                    controllerAs: 'baseDown'
                }
            },
            resolve: {
                
              adminLogin : function($q, OrderCloud, BaseService){
                     var dfd = $q.defer();
             return BaseService.AdminLogin().then(function (data) {
                  OrderCloud.Auth.SetToken(data.access_token);
                 return data.access_token
              })
               return true;

                    },
                  ticket: function(LoginFact){
                    return LoginFact.Get().then(function(data){
                    console.log(data);           
                    var ticket = data.data.ticket;
                     localStorage.setItem("alf_ticket",ticket);
                        return ticket;
                })
                },/*ticketTemp: function(LoginFact){
                    return LoginFact.GetTemp().then(function(data){
                    console.log(data);           
                    var ticket = data.data.ticket;
                     localStorage.setItem("alfTemp_ticket",ticket);
                        return ticket;
                })
                }*/
            categoryImages: function(CategoryService, ticket){
           // var ticket = localStorage.getItem("alf_ticket");
            return CategoryService.GetCategoryImages(ticket).then(function(res){
                return res.items;
            });
				}/*,
				minicartData:function($q, CurrentOrder){
					var dfd = $q.defer();
					CurrentOrder.Get().then(function(data){
						var mincart = data;
						dfd.resolve(mincart);
					});
					return dfd.promise;
				}*/

            }
        });
}

function BaseService( $q, $localForage, Underscore,  authurl, ocscope, $http, OrderCloud, alfcontenturl, CurrentOrder) {
    var service = {
       
        GetCategoryTree: _getCategoryTree,
		AdminLogin: _adminLogin,
		MinicartData: _minicartData
    };
    //_adminLogin();
   function _getCategoryTree() {
        var tree = [];
        var categories = [];
        var deferred = $q.defer();
        var queue = [];

        OrderCloud.Categories.List(null, 1, 100, null, null, null, null, 'all').then(function(data) {
            console.log(data);
            categories = categories.concat(data.Items);
                for (var i = 2; i <= data.Meta.TotalPages; i++) {
                    queue.push(OrderCloud.Categories.List(null, i, 100, null, null, null, null, 'all'));
                }
                $q.all(queue).then(function(results) {
                    angular.forEach(results, function(result) {
                        categories = categories.concat(result.Items);
				});
				//deferred.resolve(categories);

				function _getnode(node) {

					var children = Underscore.where(categories, {
						ParentID: node.ID
					});
					if (children.length > 0) {
						node.children = children;
						angular.forEach(children, function (child) {
							return _getnode(child);
						});
					} else {
						node.children = [];
					}
					return node;
				}

				angular.forEach(Underscore.where(categories, {
					ParentID: null
				}), function (node) {
					tree.push(_getnode(node));
				});
				deferred.resolve(tree);
			});
			//deferred.resolve(tree);
		});
		return deferred.promise;
	}

	/*function _getCategoryTree() {
	    var tree = [];
	    var deferred = $q.defer();
	    Categories.List(null, 'all', 1, 100).then(function(list) {
	        console.log(list);
	        function _getnode(node) {
                    
                    var children = Underscore.where(categories, { ParentID: node.ID});
                    if (children.length > 0) {
                        node.children = children;
                        angular.forEach(children, function(child) {
                            return _getnode(child);
                        });
                    } else {
                        node.children = [];
                    }
                    return node;
                }

                angular.forEach(Underscore.where(categories, { ParentID: null}), function(node) {
	            tree.push(_getnode(node));
	        });

	        deferred.resolve(tree);
	    });
	    return deferred.promise;

	}*/
     function _adminLogin(){

    var data = $.param({
            grant_type: 'client_credentials',
            scope: ocscope,
            client_id: '8836BE8D-710A-4D2D-98BF-EDBE7227E3BB'

        });
        var defferred = $q.defer();
        
        $http({

                method: 'POST',
                dataType:"json",
                url: authurl,
                data: data,
                headers: {
                    'Content-Type': 'application/json'
                }

            }).success(function (data, status, headers, config) {
               //return data.access_token;
                 OrderCloud.Auth.SetToken(data.access_token);
                defferred.resolve(data);
            }).error(function (data, status, headers, config) {
                defferred.reject(data);
            });
            return defferred.promise;
    }
        
	function _minicartData(){
		var dfd = $q.defer();
		CurrentOrder.Get().then(function(data){
			var mincart = data;
			console.log(data);
			dfd.resolve(mincart);
		});
		return dfd.promise;
	}
    return service;
}

function BaseController($scope, $timeout, $window, BaseService, $state, LoginService, $rootScope, LoginFact, OrderCloud, alfcontenturl, $sce, $http, PlpService,$q,ticket, Underscore,CategoryService,HomeFact,categoryImages,$location,CurrentOrder) {

    var vm = this;
	vm.currentPath = $location.path();
  vm.alf_ticket = ticket;
	$scope.is = function(name){
	   return $state.is(name);
	}

	//console.log('asdfghj',minicartData);
	vm.currentOrder = BaseService.MinicartData();
	console.log(vm.currentOrder);

	/*window.onorientationchange = function () {
		window.location.reload();
	}*/

    if($(window).height()<=1024){
         /*vm.tab_menu = function(pID,childCount,cID) {
            $('.menu-container li.sub-nav a').toggle(function() {
                console.log('aaaaaaaaaaaaaaaaaa');
            }, function(pID,childCount,cID) {
                  $state.go('category', {parentId:pID,childCount:childCount,ID:cID});
            });
        }*/
        vm.tab_menu = function(){
            $('.menu-container li.sub-nav a').toggle(function() {
                console.log(1111111111111111);
            }, function() {
                  console.log(22222222222222222222);
            });;
        }
    }
    // vm.openMenuLevel1 = function(){
        // vm.openMenuCont= true;
    // }
  /*  Addresses.Delete("2hxd8n5f7kuG0-S10-laQg",false).then(function (res) {
        console.log("Adredd==",res);
    }, function(res){
        console.log("Adds err==",res);
    })*/
    /*var data = {
        "accessToken": Auth.GetToken(),
        "buyerID": "Bachmans",
        "orderID": "0gJSiYk1qE6YZrci9n3F8Q"
    };*/
    /*$http.post('https://Four51TRIAL104401.jitterbit.net/Four51OnPrem/v1/CalculateTax',data).then(function(res){
        console.log("alvalara==",res);
    });*/
  /*  var userdata = {

        "firstname": "ravi",
        "lastname": "prakash",
        "email":"raviprakash.k@echidnainc.com"
    }
    $http.post('https://Four51TRIAL104401.jitterbit.net/Bachmans_Dev/constantcontact',userdata).then(function(res){
        console.log("alvalara==",res);
    });*/
    
    console.log("categoryImages",categoryImages);

    $(window).scroll(function() {
         var headerHt = $('.base-header-inner').height();
         var stickyHeaderHt = $('.base-header.sticky .base-header-top .main-logo').height();
         $('.base-header.sticky .base-header-top .delivery-details').css('height',stickyHeaderHt);
        if ($(this).scrollTop() > headerHt){  

            $('.base-header-sticky').css({'top':0});

            $('.base-header-mobile').addClass("sticky");
      }
      else{
            $('.base-header-sticky').css({'top':-headerHt});
            $('.base-header-mobile').removeClass("sticky");
      }
    });


    //web megamenu hover
    setTimeout(function(){

        $(".menu-hover-cont1").hover(bodyScrollHide, bodyScrollAuto);

        function preventDefault(e) {
          e = e || window.event;
          if (e.preventDefault)
              e.preventDefault();
          e.returnValue = false;  
        }

        function preventDefaultForScrollKeys(e) {
            if (keys[e.keyCode]) {
                preventDefault(e);
                return false;
            }
        }

        function disableScroll() {
          if (window.addEventListener) // older FF
              window.addEventListener('DOMMouseScroll', preventDefault, false);
          window.onwheel = preventDefault; // modern standard
          window.onmousewheel = document.onmousewheel = preventDefault; // older browsers, IE
          window.ontouchmove  = preventDefault; // mobile
          document.onkeydown  = preventDefaultForScrollKeys;
			//angular.element('.breadcrumb-box').css('display','none');
        }

        function enableScroll() {
            if (window.removeEventListener)
                window.removeEventListener('DOMMouseScroll', preventDefault, false);
            window.onmousewheel = document.onmousewheel = null; 
            window.onwheel = null; 
            window.ontouchmove = null;  
            document.onkeydown = null;  
			//angular.element('.breadcrumb-box').css('display','block');
        }

        function bodyScrollHide() {
            disableScroll();
            if($(window).width() <= 1024){
                enableScroll();
            }
        }
        function bodyScrollAuto() {
            enableScroll();
            if($(window).width() <= 1024){
                enableScroll();
            }
        }

        vm.megaMenuTab = function(){
            if($(window).height()<=602){
                $('body').css({'position':'initial'});
                //$('#DashboardDown .base-footer, .main-container').toggleClass('hideContainer');
            }
            $('body').toggleClass('megaMenuTabScroll');
            vm.hideOnClickTab =! vm.hideOnClickTab;
            $('.menu-hover-cont1:hover').toggleClass('menu-height');
        }

        vm.megaMenuTabSticky = function(){
            if($(window).height()<=602){
                $('body').css({'position':'initial'});
                $('#DashboardDown .base-footer, .main-container').toggleClass('hideContainer');
            }
            $('body').toggleClass('megaMenuTabScrollSticky');
            $('body').scrollTop(200);
            $('.base-header-non-sticky').toggleClass('headerHide');
            $('.base-header.sticky').toggleClass('megaMenuTabScrollStickyTop');
            vm.hideOnClickTabSticky =! vm.hideOnClickTabSticky;
        }
    },200);


	vm.nextL3= function(){
        var posByValue = $('.menuScrollCont ul li').width();
        var jumpToposition = $('.menuScrollCont ul').scrollLeft();
       	$('.menuScrollCont ul').scrollLeft(jumpToposition + (posByValue*3) + 120);
       	var ltRtArw = $('.menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');
      	$('.menuScrollCont-arrow p.menu-next').css('opacity','1');
      	$('.menuScrollCont-arrow p.menu-prev').css('opacity','1');
       	if(ltRtArw.hasClass('Left')){
       		$('.menuScrollCont-arrow p.menu-next').css('opacity','0');
       	}
       	else if(ltRtArw.hasClass('Right')){
       		$('.menuScrollCont-arrow p.menu-next').css('opacity','1');
       	}
    }
    vm.prevL3= function(){
        var posByValue = $('.menuScrollCont ul li').width();
        var jumpToposition = $('.menuScrollCont ul').scrollLeft();
       	$('.menuScrollCont ul').scrollLeft(jumpToposition - (posByValue*3) -120);
       	$('.menuScrollCont-arrow p.menu-next').css('opacity','1');
      	$('.menuScrollCont-arrow p.menu-prev').css('opacity','1');
       	var ltRtArw = $('.menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');    	
       	if(jumpToposition == 0){
			$('.menuScrollCont-arrow p.menu-prev').css('opacity','0');
       	}
       	else{
       		$('.menuScrollCont-arrow p.menu-prev').css('opacity','1');
       	}
    }

    vm.nextL3Sticky= function(){
		var posByValue1 = $('.sticky .menuScrollCont ul li').width();
        var jumpToposition = $('.sticky .menuScrollCont ul').scrollLeft();
       	$('.sticky .menuScrollCont ul').scrollLeft(jumpToposition + (posByValue1*3) + 120);
       	var ltRtArw = $('.sticky .menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');
      	$('.sticky .menuScrollCont-arrow p.menu-next').css('opacity','1');
      	$('.sticky .menuScrollCont-arrow p.menu-prev').css('opacity','1');
       	if(ltRtArw.hasClass('Left2')){
       		$('.sticky .menuScrollCont-arrow p.menu-next').css('opacity','0');
       	}
       	else if(ltRtArw.hasClass('Right2')){
       		$('.sticky .menuScrollCont-arrow p.menu-next').css('opacity','1');
       	}
    }
    vm.prevL3Sticky= function(){
        var posByValue1 = $('.sticky .menuScrollCont ul li').width();
        var jumpToposition = $('.sticky .menuScrollCont ul').scrollLeft();
       	$('.sticky .menuScrollCont ul').scrollLeft(jumpToposition - (posByValue1*3) -120);
       	$('.sticky .menuScrollCont-arrow p.menu-next').css('opacity','1');
      	$('.sticky .menuScrollCont-arrow p.menu-prev').css('opacity','1');
       	var ltRtArw = $('.sticky .menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');    	
       	if(jumpToposition == 0){
			$('.sticky .menuScrollCont-arrow p.menu-prev').css('opacity','0');
       	}
       	else{
       		$('.sticky .menuScrollCont-arrow p.menu-prev').css('opacity','1');
       	}
    }

	vm.nextL3Tab= function(){
		var posByValue2 = $('.menuLiContTab .menuScrollCont ul li').width();
        var jumpToposition2 = $('.menuLiContTab .menuScrollCont ul').scrollLeft();
       	$('.menuLiContTab .menuScrollCont ul').scrollLeft(jumpToposition2 + (posByValue2*3) + 120);
       	var ltRtArw = $('.menuLiContTab .menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');
      	$('.menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity','1');
      	$('.menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity','1');
       	if(ltRtArw.hasClass('Left3')){
       		$('.menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity','0');
       	}
       	else if(ltRtArw.hasClass('Right3')){
       		$('.menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity','1');
       	}
    }
    vm.prevL3Tab= function(){
        var posByValue2 = $('.menuLiContTab .menuScrollCont ul li').width();
        var jumpToposition2 = $('.menuLiContTab .menuScrollCont ul').scrollLeft();
       	$('.menuLiContTab .menuScrollCont ul').scrollLeft(jumpToposition2 - (posByValue2*3) -120);
       	$('.menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity','1');
      	$('.menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity','1');
       	var ltRtArw = $('.menuLiContTab .menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');    	
       	if(jumpToposition2 == 0){
			$('.menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity','0');
       	}
       	else{
       		$('.menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity','1');
       	}
    }

    vm.nextL3StickyTab= function(){
		var posByValue3 = $('.sticky .menuLiContTab .menuScrollCont ul li').width();
        var jumpToposition3 = $('.sticky .menuLiContTab .menuScrollCont ul').scrollLeft();
       	$('.sticky .menuLiContTab .menuScrollCont ul').scrollLeft(jumpToposition3 + (posByValue3*3) + 120);
    	var ltRtArw = $('.sticky .menuLiContTab .menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');
      	$('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity','1');
      	$('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity','1');
       	if(ltRtArw.hasClass('Left4')){
       		$('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity','0');
       	}
       	else if(ltRtArw.hasClass('Right4')){
       		$('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity','1');
       	}
    }
    vm.prevL3StickyTab= function(){
        var posByValue3 = $('.sticky .menuLiContTab .menuScrollCont ul li').width();
        var jumpToposition3 = $('.sticky .menuLiContTab .menuScrollCont ul').scrollLeft();
       	$('.sticky .menuLiContTab .menuScrollCont ul').scrollLeft(jumpToposition3 - (posByValue3*3) -120);
    	$('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity','1');
      	$('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity','1');
       	var ltRtArw = $('.sticky .menuLiContTab .menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');    	
       	if(jumpToposition3 == 0){
			$('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity','0');
       	}
       	else{
       		$('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity','1');
       	}
    }
    
	/*setTimeout(function () {
		$('.classForMenuArrow').hover(function(){
			if($('.menu-hover-cont3-inner').height() > 350){ 
		 		$('.menuScrollCont-arrow').css('border','1px solid red')
		 	}
		})
	}, 200);
*/
	if ($(window).width() <= 1110) {
		setTimeout(function () {
			var serviceWidth = $('.service-list').width();
			$(".scrollServiceLeft").click(function () {
				$(".service-list div").scrollLeft(0);
			});
			$(".scrollServiceRight").click(function () {
				$(".service-list div").scrollLeft(serviceWidth);
			});
		}, 200);
	}

    if($(window).width() <= 1024){
        setTimeout(function(){
            var infoHeaderWidth = $('.header-info-bar-position').width();
            var infoHeaderSearchWidth = $('#info-bar-search').width();
            var infoHeaderWidthSub = $('#info-bar-cart').width() + $('#info-bar-acc').width() + 1;
            $("#info-bar-search").hover(hideOtherLink, showOtherLink);
            function hideOtherLink() {
                $(this).css({'width':infoHeaderWidth - infoHeaderWidthSub });
                $('.info-search-text').css('width',infoHeaderWidth - infoHeaderWidthSub - infoHeaderSearchWidth);
                $('.info-bar-care, .info-bar-events').css({'display':'none'});
                $('.info-bar-search:after').css('border','none');
            }
            function showOtherLink() {
                $(this).css('width',infoHeaderSearchWidth);
                setTimeout(function(){
                    $('.info-bar-care, .info-bar-events').css('display','block');
                },500)
			}

			$("#info-bar-acc, #info-bar-cart").hover(hideOtherLink2, showOtherLink2);

			function hideOtherLink2() {
				$('.info-bar-care, .info-bar-events').css({'display': 'none'});

			}
			function showOtherLink2() {
				$('.info-bar-care, .info-bar-events').css('display', 'block');
			}


		}, 200);
	}
	if($(window).width() > 1024){
		setTimeout(function () {
			
				$(".info-bar-search").hover(expandSearchWidth, collapseSearchWidth);

				function expandSearchWidth() {
					var expSearchWidthValue = $('.header-info-bar-position').width() - $('.header-info-bar').width();
					$(this).css('width', expSearchWidthValue + 80);
				}

				function collapseSearchWidth() {
					$(this).css('width', '90px');
				}

		}, 200);
	}

    /*if($(window).width() > 1024){
        setTimeout(function(){
            $('#info-bar-search .info-search-text input').focus(function(){
                $('.info-bar-search').addClass('info-bar-search-expand');
            });
            $('#info-bar-search .info-search-text input').focusout(function(){
                $('.info-bar-search').removeClass('info-bar-search-expand');
            });
        },200)
    }*/

    vm.menuClass = "unhide";

    vm.initialSetup = function(){
            
            vm.menu1= false;
            vm.menu2= false;
            vm.menu3= false;

            $('.main-mobile-menu-container').css('overflow-y','auto');
            $('.mobile-dropdown-cont2').css('overflow-y','hidden');
            $('.mobile-dropdown-cont3').css('overflow-y','hidden');
            $('.mobile-dropdown-cont4').css('overflow-y','hidden');
            
            // $('.base-header-mobile').toggleClass('removeSticky');
            // $('body').toggleClass('hideBodyScroll');

            var windowHeight = $(window).height();
            var mobHeaderHt = $('.base-header.base-header-mobile').height();
            //alert(windowHeight);
            $('.main-mobile-menu-container.dropdown-menu').css('height',windowHeight - mobHeaderHt);
            $('.mobile-dropdown-cont2').css({'height':windowHeight - mobHeaderHt});
            $('.mobile-dropdown-cont3').css('height',windowHeight - mobHeaderHt);
            $('.mobile-dropdown-cont4').css('height',windowHeight - mobHeaderHt);


            
            
            // var menuheight = $('.main-mobile-menu-container').innerHeight();
            // $('#DashboardContent').height(menuheight);

            if (vm.menuClass === "unhide"){
                
              vm.menuClass = "hide";  
            }         else{

            vm.menuClass = "unhide";
         }
    }

    vm.initialSetup2 = function(){
            
            vm.menu1= false;
            vm.menu2= false;
            vm.menu3= false;
            $('.main-mobile-menu-container').css('overflow-y','auto');
            $('.mobile-dropdown-cont2').css('overflow-y','hidden');
            $('.mobile-dropdown-cont3').css('overflow-y','hidden');
            $('.mobile-dropdown-cont4').css('overflow-y','hidden');
        
    }
    vm.openMenuLevel1 = function(){
            vm.menu1= true;
            vm.menu2= false;
            vm.menu3= false;

            $('.main-mobile-menu-container').css('overflow-y','hidden');
            $('.mobile-dropdown-cont2').css('overflow-y','auto');
            $('.mobile-dropdown-cont3').css('overflow-y','hidden');
            $('.mobile-dropdown-cont4').css('overflow-y','hidden');


          
        //ev.stopPropagation(); 
    }
    /*vm.openMenuLevel2 = function(){
        $timeout(function(){
            vm.menu1= true;
            vm.menu2= true;
            vm.menu3= false;
        },200);
        //ev.stopPropagation();     
    }
    vm.openMenuLevel3 = function(){
        $timeout(function(){
            vm.menu1= true;
            vm.menu2= true;
            vm.menu3= true;
        },200);
        //ev.stopPropagation();
    }*/
    vm.openMenuLevel2 = function(obj){
    
        $('.main-mobile-menu-container').css('overflow-y','hidden');
        $('.mobile-dropdown-cont2').css('overflow-y','hidden');
        $('.mobile-dropdown-cont3').css('overflow-y','auto');
        $('.mobile-dropdown-cont4').css('overflow-y','hidden');
        
        if(obj.childCount>0){
                vm.menu1= true;
                vm.menu2= true;
                vm.menu3= false;
        }else{
          if(obj.ID == "c11"){

                vm.menu1= true;
                vm.menu2= true;
                vm.menu3= false;
			} else {
            $state.go('category', {childCount: obj.childCount, ID: obj.ID});
          }
        }
        vm.giftCardPlp = function(){
            $state.go('category', {childCount: obj.childCount, ID: 'c11'});
        } 
        //ev.stopPropagation();     
    }
    vm.openMenuLevel3 = function(obj, index){
    $('.main-mobile-menu-container').css('overflow-y','hidden');
    $('.mobile-dropdown-cont2').css('overflow-y','hidden');
    $('.mobile-dropdown-cont3').css('overflow-y','hidden');
    $('.mobile-dropdown-cont4').css('overflow-y','auto');
        vm.SubIndex = index;
        if(obj.childCount>0){
                vm.menu1= true;
                vm.menu2= true;
                vm.menu3= true;
            }else{
               
                $state.go('category', {childCount: obj.childCount, ID: obj.ID});
                
            }
        //ev.stopPropagation();
    }
    
    vm.logoClick = function($event){
      /*  if($scope.menuClass == "unhide"){
            alert(10);
        $scope.menuClass = "unhide";
    }*/
       // vm.initialSetup();
       vm.menu1= false;
            vm.menu2= false;
            vm.menu3= false;
        //if($scope.menuClass == "unhide"){
            $scope.menuClass = "unhide";
            vm.menuClass = "unhide";
        //}
        vm.isopen = false;
        $state.go('home');
        var owl = angular.element("#owl-carousel-events");  
                owl.owlCarousel({
                    items:2,
                    center:false,
                    loop: false,
                    nav:true,
                    //navText: ['<span class="glyphicon glyphicon-menu-left" aria-hidden="true"></span>','<span class="glyphicon glyphicon-menu-right" aria-hidden="true"></span>'],
                    navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>','<span class="events-arrow-next" aria-hidden="true"></span>'],
                    autoWidth:true,
                    //responsive: true,
                    responsive : {
                        0 : {
                            /*stagePadding:30,*/
                            margin:30
                        },
                        320 : {
                            /*stagePadding:50,*/
                            margin:5
                        },
                        768 : {
                            /*stagePadding:30,*/
                            margin:20
                        }
                    }
                });
    }
    $rootScope.$on('$stateChangeSuccess', function(e, toState) {
        $scope.menuClass = "unhide";
            vm.menuClass = "unhide";
            vm.hideOnClick = false;

            $window.scrollTo(0, 0);
            vm.isopen = false;

            $('body').css('overflow-y','auto');

            vm.hideOnClickTab = false;
            vm.hideOnClickTabSticky = false;

            $('body').removeClass('megaMenuTabScroll');
             $('body').removeClass('megaMenuTabScrollSticky');
            //$('body').removeClass('hideBodyScroll');


    });
     $rootScope.$on('$stateChangeStart', function(e, toState) {
            //$('body').removeClass('hideBodyScroll');
    });

    vm.isShowing = function(index){
        return vm.SubIndex === index;
    }

	/*vm.stateChange = function (obj) {
		$state.go('category', {
			childCount: obj.childCount,
			ID: obj.ID
		});
	}*/
	vm.stateChange = function (obj) {
		console.log("qwerty", obj);
		if(obj.children>0){
			$state.go('category', {
				childCount: obj.childCount,
				ID: obj.ID
			});
		}
		else{
			$state.go('plp', {
				catId: obj.ID
			});
		}

	}

    vm.mobileMenu = function(data){
        
        vm.url="#/home";
    }
    vm.removeHomeSroll = function(){
        //$('body').removeClass('hideBodyScroll');
        //vm.isopen = false;
    }
    
/*BaseService.AdminLogin().then(function(res){
     console.log("token==",res);
        
      Auth.SetToken(res.access_token);*/
   // if(AdminLogin) {
        var megamenuImgs = [];
      /*  CategoryService.GetCategoryImages(ticket).then(function (res) {

            angular.forEach(Underscore.where(res.items, {title: 'megamenu'}), function (node) {
                node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
                megamenuImgs.push(node);
            });
            console.log("megamenuImgs==", megamenuImgs);
        });*/
        BaseService.GetCategoryTree().then(function (data) {
            angular.forEach(Underscore.where(categoryImages, {title: 'megamenu'}), function (node) {
                node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
                megamenuImgs.push(node);
            });
            console.log("megamenuImgs==", megamenuImgs);
            angular.forEach(megamenuImgs, function (image) {
                angular.forEach(data, function (cat) {
                    var lool = image.displayName.indexOf(cat.ID) > -1
                    if (lool) {
                        cat["imgcontent"] = image;
                    }
                });
            })
            vm.tree = data;
            console.log("shyam==", vm.tree);

        });
        //$state.go($state.current.name);
   // }
 //});
  
    if(ticket){
   // var ticket = localStorage.getItem("alf_ticket");
       LoginFact.GetLogo(ticket).then(function(data){
        console.log(data);
        var logo = alfcontenturl+data.items[1].contentUrl+"?alf_ticket="+ticket;
        vm.logo = $sce.trustAsResourceUrl(logo);
        var headerlinks = alfcontenturl+data.items[0].contentUrl+"?alf_ticket="+ticket;
        $http({
            method: 'GET',
            dataType:"json",
            url: headerlinks,
            headers: {
                'Content-Type': 'application/json'
            }
        }).success(function (data, status, headers, config) {              
            console.log("headerlinks==", data);
            vm.delivery = data[2];
            vm.contactdetails = data[1].contactdetails;
            vm.storeloc = data[0].staticlinks[0];
            vm.contact = data[0].staticlinks[1];
              vm.information = data[0].staticlinks[2];
            vm.workshop = data[0].staticlinks[3];
        }).error(function (data, status, headers, config) {
            console.log(data);
        });
}); 
             LoginFact.GetServices(ticket).then(function(data){
        console.log("GetServices==",data.items);
                 var services_mobile =[];
                 var services =[];
        /*for(var i=0;i<data.items.length;i++){
            data.items[i].contentUrl  = alfcontenturl+data.items[i].contentUrl+"?alf_ticket="+ticket;

        }*/
                 angular.forEach(Underscore.where(data.items), function(node) {

                     if(node.title === 'mobile') {

                         services_mobile.push(alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket);
                     }
                     else{
                         node.contentUrl = alfcontenturl+node.contentUrl+"?alf_ticket="+ticket;
                         services.push(node);
                     }
                 });
                 vm.services = services;
                 vm.services_mobile = services_mobile;

});
LoginFact.GetContactInfo(ticket).then(function(res){
        vm.contactImgs = [];
        vm.contacttitle = [];
        vm.description = [];
        angular.forEach(res.items, function(item){
        var quicklink = $sce.trustAsResourceUrl(alfcontenturl+item.contentUrl+"?alf_ticket="+ticket);
      //  var title  = $sce.trustAsHtml(item.title);
        vm.contactImgs.push(quicklink);
        vm.contacttitle.push(item.title);
        vm.description.push(item.description);
        })
    });
  LoginFact.GetBrandSpot(ticket).then(function(data){
        vm.brandSpot = alfcontenturl+data.items[1].contentUrl+"?alf_ticket="+ticket;       
        vm.history = $sce.trustAsHtml(data.items[1].description);
        var footerlinks = alfcontenturl+data.items[0].contentUrl+"?alf_ticket="+ticket;
         $http({
            method: 'GET',
            dataType:"json",
            url: footerlinks,
            headers: {
                'Content-Type': 'application/json'
            }
        }).success(function (data, status, headers, config) {  
            vm.footerlinks = data;
           
        }).error(function (data, status, headers, config) {
            console.log(data);
        });
});
  LoginFact.GetStaticTemp(ticket).then(function(res){
    console.log("static temp", res);
			vm.staticTempleft = $sce.trustAsResourceUrl(alfcontenturl+res.items[0].contentUrl+"?alf_ticket="+ticket);
			//vm.staticTempright = $sce.trustAsResourceUrl(alfcontenturl+res.items[2].contentUrl+"?alf_ticket="+ticket);
		})
			LoginFact.GetFolders(ticket).then(function(res){
			console.log("static temp GetFolders", res);
			var ajaxarr = [];
			var deferred = $q.defer();
			angular.forEach(res.items,function(item){
				var d = $q.defer();
				ajaxarr.push(LoginFact.GetSubFolders(ticket, item.fileName).then(function(response){
					console.log("static temp GetSubFolders", response);
					item["subfolders"]=response
					deferred.resolve(item);
					d.resolve();
					return item;
				}))
			})

			// angular.forEach(list.Items, function (item) {
   //              var promise = Categories.Get(item.CategoryID);
   //              ajaxarr.push(promise);
   //          });
   //          $q.all(ajaxarr).then(function (items) {
   //              console.log("_categoryDeatil==", items);
   //              deferred.resolve(items);

   //          });

			$q.all(ajaxarr).then(function(all){
				vm.ListOfPages = all;

			});

		});

		LoginFact.GetPerplePerksSvg(ticket).then(function(res){

			var quicklinkPP = alfcontenturl + res.items[3].contentUrl + "?alf_ticket=" + ticket;
			vm.quicklinkPP = $sce.trustAsResourceUrl(quicklinkPP);

			var quicklinkPPHover = alfcontenturl + res.items[4].contentUrl + "?alf_ticket=" + ticket;
			vm.quicklinkPPHover = $sce.trustAsResourceUrl(quicklinkPPHover);
		    
		});

	}
/*floating header*/
    
/*   $scope.navClass = 'sticky';
   $scope.constantheader = 'nohide';
   angular.element($window).bind(
    "scroll", function() {
         if(window.pageYOffset > 0) {
           $scope.navClass = 'sticky';
         } else {
           $scope.navClass = 'nosticky';
         }
         $scope.$apply();
   });*/
	(function($) {
	    
	    $.belowthefold = function(lookIn, elements, settings) {
	        var fold = $(lookIn).height() + $(lookIn).scrollTop();
	        console.log(elements);
	        return $(elements).filter(function(){
	            return fold <= $(this).offset().top - settings.threshold;
	        });
	    };
	    
	    $.abovethetop = function(lookIn, elements, settings) {
	        var top = $(lookIn).scrollTop();
	        return $(elements).filter(function(){
	            return top >= $(this).offset().top + $(this).height() - settings.threshold;
	        });
	    };
	    
	    $.rightofscreen = function(lookIn, elements, settings) {
	        var fold = $(lookIn).width() + $(lookIn).scrollLeft();
	        return $(elements).filter(function(){
	            return fold <= $(this).offset().left - settings.threshold;
	        });
	    };
	    
	    $.leftofscreen = function(lookIn, elements, settings) {
	        var left = $(lookIn).scrollLeft();
	        return $(elements).filter(function(){
	            return left >= $(this).offset().left + $(this).width() - settings.threshold;
	        });

	    };
	  
	})(jQuery);

	// Call it
	$.belowthefold("#lookInMe", ".peek", {threshold : 0}).addClass("Below");
	$.abovethetop("#lookInMe", ".peek", {threshold : 0}).addClass("Above");
	$.leftofscreen("#lookInMe", ".peek", {threshold : 0}).addClass("Left");
	$.rightofscreen("#lookInMe", ".peek", {threshold : 0}).addClass("Right");

	$.leftofscreen("#lookInMe2", ".peek2", {threshold : 0}).addClass("Left2");
	$.rightofscreen("#lookInMe2", ".peek2", {threshold : 0}).addClass("Right2");

	$.leftofscreen("#lookInMe3", ".peek3", {threshold : 0}).addClass("Left3");
	$.rightofscreen("#lookInMe3", ".peek3", {threshold : 0}).addClass("Right3");

	$.leftofscreen("#lookInMe4", ".peek4", {threshold : 0}).addClass("Left4");
	$.rightofscreen("#lookInMe4", ".peek4", {threshold : 0}).addClass("Right4");

	vm.hideShowMenuArrow = function(){
		setTimeout(function(){
			var contToHideShow=$('.menu-hover-cont3-inner');
      $('.menu-hover-cont2.menu-container').addClass('thisIsHovered');
			if(contToHideShow.scrollWidth>contToHideShow.offsetWidth){
			    $('.menuScrollCont-arrow').css('display','block');
			}else{
	    		$('.menuScrollCont-arrow').css('display','none');
	    	}
		},200)
	}

  vm.thisHoveredOut = function(){
    setTimeout(function(){
      $('.menu-hover-cont2.menu-container').removeClass('thisIsHovered');
    },200)
  }

}


function BaseTopController(LoginFact, BaseService, $uibModal, $rootScope, LoginService, $state, OrderCloud, alfcontenturl) {
    var vm = this;
     $rootScope.$on('getcurrentuser', function() {
        //alert(100);

         LoginService.GetCurrentUser().then(function(res){
                    console.log(res);
                    vm.currentUser = res;
                    vm.showuserdetail = true;
                })
       
    });
   /* BaseService.GetCategoryTree().then(function(data){

        console.log("tree ==",data);
        vm.tree = data;
    });*/
   // console.log(Tree);
    
    vm.searchPopup = function() {
        vm.searchMobCont = true;
        $('body').css({'position':'fixed', 'width':'100%'});

        var windowHeightSearch = $(window).height();
        var mobHeaderHtSearch = $('.base-header.base-header-mobile').height();

        $('.searchPopupCont').css('height',windowHeightSearch - mobHeaderHtSearch);
    }
    vm.searchPopupClose = function() {
        vm.searchMobCont = false;
        $('body').css({'position':'initial', 'width':'100%'});
    }
    /*vm.searchPopup = function() {
        console.log('mobileHeaderHt' + mobileHeaderHt);
        var modalInstance = $uibModal.open({
            animation: true,
            backdropClass: 'searchPopupCont', 
            template: '<div class="search_cont">'+
                        '<div class="search_cont_header">'+
                            '<div class="input-search">'+
                                '<input type="text" placeholder="SEARCH" />'+
                            '</div>'+
                            '<div class="close-search" ng-click="cancel()">'+
                                '<a>'+
                                    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"'+
                                            ' viewBox="-26.2 -77.7 33.4 33.4" style="enable-background:new -26.2 -77.7 33.4 33.4;" xml:space="preserve">'+
                                        '<style type="text/css">'+
                                            '.st0{fill:#FFFFFF;}'+
                                        '</style>'+
                                        '<g>'+
                                            '<g>'+
                                                '<rect x="-32.3" y="-61.8" transform="matrix(-0.7071 -0.7071 0.7071 -0.7071 26.916 -110.851)" class="stw" width="45.6" height="1.6"/>'+
                                            '</g>'+
                                            '<g>'+
                                                '<rect x="-32.3" y="-61.8" transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 -59.351 -97.416)" class="stw" width="45.6" height="1.6"/>'+
                                            '</g>'+
                                        '</g>'+
                                    '</svg>'+
                                '</a>'+
                            '</div>'+
                        '</div>'+
                    '</div>',
            controller:'LoginCtrl',
            controllerAs: 'login',
            size: 'sm'
        });


        modalInstance.result.then(function() {
            
        }, function() {
            angular.noop();
        });
    }*/
    
    vm.login = function() {
        var modalInstance = $uibModal.open({
			animation: false,
            backdropClass: 'loginModalBg',
            windowClass: 'loginModalBg',
            templateUrl: 'login/templates/login.modal.tpl.html',
            controller:'LoginCtrl',
            controllerAs: 'login'
            // size: 'sm'
        });

        modalInstance.result.then(function() {
            
        }, function() {
            angular.noop();
        });
    }
    vm.logout = function() {
        OrderCloud.Auth.RemoveToken();
        OrderCloud.Auth.RemoveImpersonationToken();
        //BuyerID.Set(null);
       // ImpersonationService.StopImpersonating();
        $state.go('home');
        vm.showuserdetail = false;
    };
    
}

function BaseDownController(LoginFact,  BaseService, $sce, alfcontenturl,$http) {
    var vm = this;
    /*BaseService.GetCategoryTree().then(function(data){

        console.log("tree ==",data);
        vm.tree = data;
    });*/
 /*   var ticket = localStorage.getItem("alf_ticket");
        LoginFact.GetBrandSpot(ticket).then(function(data){
        vm.brandSpot = alfcontenturl+data.items[1].contentUrl+"?alf_ticket="+ticket;       
        vm.history = $sce.trustAsHtml(data.items[1].description);
        var footerlinks = alfcontenturl+data.items[0].contentUrl+"?alf_ticket="+ticket;
         $http({
            method: 'GET',
            dataType:"json",
            url: footerlinks,
            headers: {
                'Content-Type': 'application/json'
            }
        }).success(function (data, status, headers, config) {  
            vm.footerlinks = data;
           
        }).error(function (data, status, headers, config) {
            console.log(data);
        });
});*/

}

function LoginFact($http, $q, alfrescourl, alflogin, alfrescofoldersurl) {
    var service = {
        Get: _get,
        GetTemp: _getTempLogin,
        GetLogo:_getLogo,
        GetBrandSpot:_getBrandSpot,
        GetServices:_getServices,
        GetContactInfo:_getContactInfo,
        GetStaticTemp:_getStaticTemp,
		GetFolders:_getFolders,
		GetSubFolders:_getSubFolders,
		GetArtcleList:_getArtcleList,
		GetPerplePerksSvg: _getPerplePerksSvg
    };
    return service;

    function _get() {
        var data = {
            
            username: "admin",
            password: "echidna"
        };
        var defferred = $q.defer();
        
        $http({

                method: 'POST',
                dataType:"json",
                url:alflogin,
            //  url: "http://192.168.100.184:8080/alfresco/service/api/login",
             //  url: "http://103.227.151.31:8080/alfresco/service/api/login",

                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }

            }).success(function (data, status, headers, config) {
                
                defferred.resolve(data);
            }).error(function (data, status, headers, config) {
                defferred.reject(data);
            });
            return defferred.promise;
    }
    function _getTempLogin() {
            var data = {

                username: "admin",
                password: "echidna"
            };
            var defferred = $q.defer();

            $http({

                method: 'POST',
                dataType: "json",
                url: "http://192.168.101.49:8080/alfresco/service/api/login",
                //  url: "http://192.168.100.184:8080/alfresco/service/api/login",
                //  url: "http://103.227.151.31:8080/alfresco/service/api/login",

                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }

            }).success(function(data, status, headers, config) {

                defferred.resolve(data);
            }).error(function(data, status, headers, config) {
                defferred.reject(data);
            });
            return defferred.promise;
        }
    function _getLogo(ticket) {
        
        var defferred = $q.defer();
        
        $http({

                method: 'GET',
                dataType:"json",
                url: alfrescourl+"Header/Logo?alf_ticket="+ticket,
               
                headers: {
                    'Content-Type': 'application/json'
                }

            }).success(function (data, status, headers, config) {               
                defferred.resolve(data);
            }).error(function (data, status, headers, config) {
                defferred.reject(data);
            });
            return defferred.promise;
    }

    function _getBrandSpot(ticket) {
        
        var defferred = $q.defer();
        
        $http({

                method: 'GET',
                dataType:"json",
                  url: alfrescourl+"Footer/BrandSpot?alf_ticket="+ticket,
              //  url: alfrescourl+"HomePage/Quicklinks?alf_ticket="+ticket,
               
                headers: {
                    'Content-Type': 'application/json'
                }

            }).success(function (data, status, headers, config) { 
                  
                defferred.resolve(data);
            }).error(function (data, status, headers, config) {
                defferred.reject(data);
            });
            return defferred.promise;
    }

     function _getServices(ticket) {
        
        var defferred = $q.defer();
        
        $http({

                method: 'GET',
                dataType:"json",
                url: alfrescourl+"HomePage/Services?alf_ticket="+ticket,
               
                headers: {
                    'Content-Type': 'application/json'
                }

            }).success(function (data, status, headers, config) {               
                defferred.resolve(data);
            }).error(function (data, status, headers, config) {
                defferred.reject(data);
            });
            return defferred.promise;
    }

    function _getContactInfo(ticket) {
        var defferred = $q.defer(); 
        $http({
            method: 'GET',
            dataType:"json",
            url: alfrescourl+"HomePage/Contactbar?alf_ticket="+ticket,
            headers: {
                'Content-Type': 'application/json'
            }
        }).success(function (data, status, headers, config) {              
            defferred.resolve(data);
        }).error(function (data, status, headers, config) {
            defferred.reject(data);
        });
        return defferred.promise;
    }
    function _getStaticTemp(ticket) {
        var defferred = $q.defer(); 
        $http({
            method: 'GET',
            dataType:"json",
			url: alfrescourl+"StaticTemplate/leftPanel?alf_ticket="+ticket,
			headers: {
				'Content-Type': 'application/json'
			}
		}).success(function (data, status, headers, config) {
			defferred.resolve(data);
		}).error(function (data, status, headers, config) {
			defferred.reject(data);
		});
		return defferred.promise;
	}

	function _getPerplePerksSvg(ticket) {
		var defferred = $q.defer(); 
		$http({
			method: 'GET',
			dataType:"json",
			url: alfrescourl+"CategoryPage/QuickLinks?alf_ticket="+ticket,
			headers: {
				'Content-Type': 'application/json'
			}
		}).success(function (data, status, headers, config) {              
			defferred.resolve(data);
		}).error(function (data, status, headers, config) {
			defferred.reject(data);
		});
		return defferred.promise;
	}


	function _getFolders(ticket) {
		var defferred = $q.defer();
		$http({
			method: 'GET',
			dataType:"json",
			//url: alfrescofoldersurl+"StaticTemplate/StaticPageCategories?alf_ticket="+ticket,
			url: "http://192.168.101.49:8080/alfresco/service/slingshot/doclib/doclist/folders/site/testsite/documentLibrary/Alfresco Quick Start/Bachmans Editorial/root?alf_ticket="+localStorage.getItem('alfTemp_ticket'),
			headers: {
				'Content-Type': 'application/json'
			}
		}).success(function (data, status, headers, config) {
			defferred.resolve(data);
		}).error(function (data, status, headers, config) {
			defferred.reject(data);
		});
		return defferred.promise;
	}

	function _getSubFolders(ticket, subfolder){
		var defferred = $q.defer();
		$http({
			method: 'GET',
			dataType:"json",
			url: alfrescofoldersurl+"StaticTemplate/StaticPageCategories/"+subfolder+"?alf_ticket="+ticket,
			url: "http://192.168.101.49:8080/alfresco/service/slingshot/doclib/doclist/folders/site/testsite/documentLibrary/Alfresco Quick Start/Bachmans Editorial/root/"+subfolder+"?alf_ticket="+localStorage.getItem('alfTemp_ticket'),
			headers: {
				'Content-Type': 'application/json'
			}
		}).success(function (data, status, headers, config) {
			defferred.resolve(data);
		}).error(function (data, status, headers, config) {
			defferred.reject(data);
		});
		return defferred.promise;
	}

	function _getArtcleList(ticket, route){
		var defferred = $q.defer();
		$http({
			method: 'GET',
			dataType:"json",
			//url: alfrescofoldersurl+"StaticTemplate/StaticPageCategories/"+route+"?alf_ticket="+ticket,
            url: "http://192.168.101.49:8080/alfresco/service/slingshot/doclib/doclist/folders/site/testsite/documentLibrary/Alfresco Quick Start/Bachmans Editorial/root/"+route+"?alf_ticket="+localStorage.getItem('alfTemp_ticket'),
			headers: {
				'Content-Type': 'application/json'
			}
		}).success(function (data, status, headers, config) {
			defferred.resolve(data);
		}).error(function (data, status, headers, config) {
			defferred.reject(data);
		});
		return defferred.promise;
	}


    }

function windowHeightDirective($window) {
	return {
	    restrict: 'A',
	    link: function(scope, element){
	        scope.windowHeight = $window.innerHeight - 60;
	    }
	};
}

function contTopPaddingDirective() {
	return {
	    restrict: 'A',
	    link:function(scope){
		 	scope.pageTopPadding =  
			 	angular.element('.base-header-desktop .base-header-inner').height() + 9;
		 	if($(window).width() <= 810)
		   		scope.pageTopPadding =  angular.element('.base-header-mobile .base-header-inner').height();
		}
	};
}

function scrollDirective($window) {
	return {
	    restrict: 'A',
	    link:function(scope, element, attrs) {
	        angular.element($window).bind("scroll", function() {
	            if (this.pageYOffset >= 100) {
	                 scope.boolChangeClass = true;
	                 console.log('Scrolled below header.');
	             } else {
	                 scope.boolChangeClass = false;
	                 console.log('Header is in view.');
	             }
	            scope.$apply();
	        });
	    }
	};
}


function phoneValidationDirective($parse){

   return {
        restrict: 'A',
        require: ['ngModel'],
        link: function(scope, element, attrs, ctrls) {
            var model=ctrls[0], form=ctrls[1];
            
            scope.next = function(){
                return model.$valid
            }
            
            scope.$watch(scope.next, function(newValue, oldValue){
                if (newValue && model.$dirty)
                {
                    var nextinput = element.parent().next().find('input');
                    if (nextinput.length === 1)
                    {
                        nextinput[0].focus();
                    }
                }
            })
        }
    }
}