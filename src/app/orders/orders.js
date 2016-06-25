angular.module( 'orderCloud' )

    .config( OrdersConfig )
    .controller( 'OrdersCtrl', OrdersController )
    //.controller( 'OrderHistoryDetailCtrl', OrderHistoryDetailController)
    .controller( 'OrderHistoryDetailLineItemCtrl', OrderHistoryDetailLineItemController )
    .factory( 'OrderHistoryFactory', OrderHistoryFactory )
    //.controller( 'OrderEditCtrl', OrderEditController )
    //.factory( 'OrdersTypeAheadSearchFactory', OrdersTypeAheadSearchFactory )

function OrdersConfig( $stateProvider ) {
    $stateProvider
        .state( 'orders', {
            parent: 'base',
            url: '/orders',
            resolve:{
                CurrentUser: function($q, $state, Auth, BuyerID, Me) {
                    var dfd = $q.defer();
                    Auth.IsAuthenticated()
                        .then(function() {
                            Me.Get()
                                .then(function(data) {
                                    console.log(data); 
                                    dfd.resolve(data);
                                })
                                .catch(function(){
                                    Auth.RemoveToken();
                                    BuyerID.Set(null);
                                    //$state.go('login');
                                    dfd.resolve();
                                })
                        })
                        .catch(function() {
                            BuyerID.Set(null);
                            //$state.go('login');
                            dfd.resolve();
                        })
                    ;
                    return dfd.promise;
                }
            },
            
            templateUrl:'orders/templates/orders.tpl.html',
            controller:'OrdersCtrl',
            controllerAs: 'orders'
            /*data: {componentName: 'Orders'},
            resolve: {
                OrderList: function(Orders) {
                    return Orders.List('incoming');
                }
            }*/
                
        })
        .state( 'orders.detail', {
            url: '/:orderid',
            templateUrl: 'orders/templates/order.detail.tpl.html',
            controller: 'OrderHistoryDetailCtrl',
            controllerAs: 'orderHistoryDetail',
            resolve: {
                SelectedOrder: function($stateParams, OrderHistoryFactory) {
                    return OrderHistoryFactory.GetOrderDetails($stateParams.orderid);
                }
            }
        })
        .state( 'orders.event', {
            url:'event',
            templateUrl: 'orders/templates/event.tpl.html',
            controller: 'OrdersCtrl',
            controllerAs: 'orders'
           })
        .state( 'orders.trackordersingle', {
            url:'/:orderid',
            templateUrl: 'orders/templates/trackordersingle.tpl.html',
            controller: 'OrdersCtrl',
            controllerAs: 'orders'
           })
        .state( 'orders.detail.lineItem', {
            url: '/:lineitemid',
            templateUrl: 'orders/templates/order.detail.lineItem.tpl.html',
            controller: 'OrderHistoryDetailLineItemCtrl',
            controllerAs: 'orderHistoryDetailLineItem',
            /*resolve: {
                SelectedLineItem: function($stateParams,OrderHistoryFactory) {
                    return OrderHistoryFactory.GetLineItemDetails($stateParams.orderid, $stateParams.lineitemid);
                }
            }*/
             });
}
        /*.state( 'orders.edit', {
            url: '/:orderid/edit',
            templateUrl:'orders/templates/orderEdit.tpl.html',
            controller:'OrderEditCtrl',
            controllerAs: 'orderEdit',
            resolve: {
                SelectedOrder: function($stateParams, Orders) {
                    return Orders.Get($stateParams.orderid);
                },
                LineItemList: function($stateParams, LineItems) {
                    return LineItems.List($stateParams.orderid);
                }
            }
        });
}
/*function OrdersTypeAheadSearchFactory($q, SpendingAccounts, Addresses, Underscore, Me) {
    return {
        GetCurrentUser:_GetCurrentUser,
        List:_list*/
        /*SpendingAccountList: SpendingAccountList,
        ShippingAddressList: ShippingAddressList,
        BillingAddressList: BillingAddressList*/
    /*};
    function _GetCurrentUser(){
         var dfd = $q.defer();
         Me.Get().then(function(data) {
                                   dfd.resolve(data);
                                   console.log(data);
                                })
                                .catch(function(res){
                                    console.log(res);
                                    Auth.RemoveToken();
                                    BuyerID.Set(null);
                                   //$state.go('login');
                                    dfd.resolve();
                                })
                                return dfd.promise;
    }
    function _list(CurrentUser,Orders){
        var vm=this;
        var dfd = $q.defer();
        //orderid=Orders.ID;
        Orders.List('incoming').then(function(){
            dfd.resolve();
            console.log("jfjdfjdkf");
        })
.catch(function(res){
    console.log(res);
})
return dfd.promise;
        }
    }
    */

function OrdersController(CurrentUser,Orders, Me, LineItems, $q, OrderHistoryFactory){
var vm = this;
console.log(CurrentUser);
Me.ListOrders().then(function(res){
vm.showOrders=res;
var filter ={
        "xp.IsEvent":true
    };
Me.ListOrders(null, 1, 100, null, null, filter, null, null).then(function(re){
    vm.eventslist=re;
    console.log("Events are-:",vm.eventslist);
})

/*vm.trackorder=function(orderid){
    Me.GetOrder(orderid).then(function(trackship_single_order){
        vm.trackorderdata=trackship_single_order;
        console.log("trackorderdata==",vm.trackorderdata);
    })
}*/
/*var filter ={
        "xp.IsEvent":true
    };
   // from, to, search, page, pageSize, searchOn, sortBy, filters, buyerID
Orders.ListIncoming("incoming", null, null,CurrentUser.ID, 1, 100, "FromUserID", null,filter).then(function(res){
console.log(res);
vm.eventdata =res;
});*/
var arr=[];
vm.lineitemarr = [];
for(var i=0;i<res.Items.length;i++)
{
   var promise = OrderHistoryFactory.GetOrderDetails(res.Items[i].ID);
   arr.push(promise);
}
$q.all(arr).then(function(results){
console.log("results",results);
});
console.log("me fater======",res);


/*Me.ListProducts(null, 1, 100, null, null, null,null).then(function(rrr){
    console.log("products....",rrr);
})*/
vm.eventdata = _.filter(res.Items, function(item, i) {
   // if(item.xp.IsEvent=undefined)
   if(item.xp.IsEvent == null){
    return item.xp.IsEvent = true;
   }
        

else
alert("not valid");

    })

console.log("event data",vm.eventdata);
vm.orderdata = _.filter(res.Items, function(item, i) {
        return item.xp.IsEvent != true;

    });
});

vm.lineitemdetail = function(orderid){
    LineItems.List(orderid).then(function(itemres){
        console.log("line items are-:-",itemres);
        
    })
}
}
/*Orders.List("incoming", null, null,CurrentUser.ID, 1, 100, "FromUserID", null,filter).then(function(res){
console.log(res);
vm.orderdata =res;
});
var filter ={
        "xp.IsEvent":true
    };

Orders.List("incoming", null, null,CurrentUser.ID, 1, 100, "FromUserID", null,filter).then(function(res){
//$state.go('orders.detail',null,null);
//$state.transitionTo('orders.event');
console.log(res);
vm.eventdata =res;
})*/
//}
/*function EventsController(CurrentUser, Orders)
{
    var vm = this;
    var filter ={
        "xp.IsEvent":true
    };
console.log(CurrentUser);
Orders.List("incoming", null, null,CurrentUser.ID, 1, 100, "FromUserID", null,filter).then(function(res){
console.log(res);
vm.eventdata =res;
})

}*/
/*function OrderHistoryDetailController(SelectedOrder) {
    var vm = this;
    vm.order = SelectedOrder;
    console.log("orders are:-",vm.order);
}*/
function OrderHistoryDetailLineItemController(SelectedLineItem) {
    var vm = this;
    vm.lineitems = SelectedLineItem;
    console.log("linnfnnn",vm.lineitems);
}
function OrderHistoryFactory( $q, Underscore, Orders, LineItems, Products, SpendingAccounts ) {
    var service = {
        GetOrderDetails: _getOrderDetails,
        GetLineItemDetails: _getLineItemDetails
    };

    function _getOrderDetails(orderID) {
        var deferred = $q.defer();
        var order;
        var lineItemQueue = [];
        var productQueue = [];

        Orders.Get(orderID)
            .then(function(data) {
                order = data;
                order.LineItems = [];
                gatherLineItems();
            });

        function gatherLineItems() {
            LineItems.List(orderID, 1, 100)
                .then(function(data) {
                    order.LineItems = order.LineItems.concat(data.Items);
                    for (var i = 2; i <= data.Meta.TotalPages; i++) {
                        lineItemQueue.push(LineItems.List(orderID, i, 100));
                    }
                    $q.all(lineItemQueue).then(function(results) {
                        angular.forEach(results, function(result) {
                            order.LineItems = order.LineItems.concat(result.Items);
                        });
                        gatherProducts();
                    });
                });
        }

        function gatherProducts() {
            var productIDs = Underscore.uniq(Underscore.pluck(order.LineItems, 'ProductID'));

            angular.forEach(productIDs, function(productID) {
                productQueue.push((function() {
                    var d = $q.defer();

                    Products.Get(productID)
                        .then(function(product) {
                            angular.forEach(Underscore.where(order.LineItems, {ProductID: product.ID}), function(item) {
                                item.Product = product;
                            });

                            d.resolve();
                        });

                    return d.promise;
                })());
            });

            $q.all(productQueue).then(function() {
                if (order.SpendingAccountID) {
                    SpendingAccounts.Get(order.SpendingAccountID)
                        .then(function(sa) {
                            order.SpendingAccount = sa;
                            deferred.resolve(order);
                        });
                }
                else {
                    deferred.resolve(order);
                }
            });
        }

        return deferred.promise;
    }

    function _getLineItemDetails(orderID, lineItemID) {
        var deferred = $q.defer();
        var lineItem;

        LineItems.Get(orderID, lineItemID)
            .then(function(li) {
                lineItem = li;
                getProduct();
            });

        function getProduct() {
            Products.Get(lineItem.ProductID)
                .then(function(product) {
                    lineItem.Product = product;
                    deferred.resolve(lineItem);
                });
        }

        return deferred.promise;
    }

    return service;
}

/*vm.orders = Orders.Get(CurrentUser.ID);
    console.log("gfgghg",vm.orders);
    vm.lll=LineItems.List("O4iozNT3AkeRZNTkpcxh3g", 1, 100);
    console.log("lllllfgf",vm.lll);

    }*/
/*function OrderHistoryController(Orders, LineItems,CurrentUser) {
    var vm = this;
    vm.orders = Orders.Get(CurrentUser.ID);
    console.log("gfgghg",vm.orders);
    vm.lll=LineItems.List("O4iozNT3AkeRZNTkpcxh3g", 1, 100);
    console.log("lllllfgf",vm.lll);
}*/

/*
function OrdersController(OrdersTypeAheadSearchFactory, CurrentUser) {
    var vm = this;
    vm.id=function(){
    OrdersTypeAheadSearchFactory.GetCurrentUser.then(function(res)
    {
        console.log(data);
    })
    .catch(function(ex) {
                $exceptionHandler(ex);
            })
}
vm.GetUserOrder=function(){
    OrdersTypeAheadSearchFactory.List.then(function()
    {
        console.log("dfjjjj");
    })
    .catch(function(ex)
    {
        $exceptionHandler(ex);
    })
}
    
}*/

/*function OrderEditController( $exceptionHandler, $state, SelectedOrder, OrdersTypeAheadSearchFactory, LineItemList, Orders, LineItems, $scope, $q, Users) {
    var vm = this,
    orderid = SelectedOrder.ID;
    vm.order = SelectedOrder;
    vm.orderID = SelectedOrder.ID;
    vm.list = LineItemList;
    vm.pagingfunction = PagingFunction;
    $scope.isCollapsedPayment = true;
    $scope.isCollapsedBilling = true;
    $scope.isCollapsedShipping = true;

    vm.deleteLineItem = function(lineitem) {
        LineItems.Delete(orderid, lineitem.ID)
            .then(function() {
                $state.go($state.current, {}, {reload: true});
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.updateBillingAddress = function(){
        vm.order.BillingAddressID = null;
        vm.order.BillingAddress.ID = null;
        Orders.Update(orderid, vm.order)
            .then(function(){
            Orders.SetBillingAddress(orderid, vm.order.BillingAddress)
                .then(function() {
                    $state.go($state.current, {}, {reload: true});
                });
        })
    };

    vm.updateShippingAddress = function(){
        Orders.SetShippingAddress(orderid, vm.ShippingAddress)
            //.then(function() {
            //    $state.go($state.current, {}, {reload: true});
            //});
    };

    vm.Submit = function() {
        var dfd = $q.defer();
        var queue = [];
        angular.forEach(vm.list.Items, function(lineitem, index) {
            if ($scope.EditForm.LineItems['Quantity' + index].$dirty || $scope.EditForm.LineItems['UnitPrice' + index].$dirty ) {
                queue.push(LineItems.Update(orderid, lineitem.ID, lineitem));
            }
        });
        $q.all(queue)
            .then(function() {
                dfd.resolve();
                Orders.Update(orderid, vm.order)
                    .then(function() {
                        $state.go('orders', {}, {reload:true});
                    })
                    .catch(function(ex) {
                        $exceptionHandler(ex)
                    });
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });

        return dfd.promise;
    };
    vm.Delete = function() {
        Orders.Delete(orderid)
            .then(function() {
                $state.go('orders', {}, {reload:true});
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
    function PagingFunction() {
        if (vm.list.Meta.Page < vm.list.Meta.PageSize) {
            LineItems.List(vm.order.ID, vm.list.Meta.Page + 1, vm.list.Meta.PageSize).then(
                function(data) {
                    vm.list.Meta = data.Meta;
                    vm.list.Items = [].concat(vm.list.Items, data.Items);
                }
            )
        }
    }
    vm.spendingAccountTypeAhead = OrdersTypeAheadSearchFactory.SpendingAccountList;
    vm.shippingAddressTypeAhead = OrdersTypeAheadSearchFactory.ShippingAddressList;
    vm.billingAddressTypeAhead = OrdersTypeAheadSearchFactory.BillingAddressList;
}
*/


    /*function SpendingAccountList(term) {
        return SpendingAccounts.List(term).then(function(data) {
            return data.Items;
        });
    }

    function ShippingAddressList(term) {
        var dfd = $q.defer();
        var queue = [];
        queue.push(Addresses.List(term));
        queue.push(Addresses.ListAssignments(null, null, null, null, true));
        $q.all(queue)
            .then(function(result) {
                var searchAssigned = Underscore.intersection(Underscore.pluck(result[0].Items, 'ID'), Underscore.pluck(result[1].Items, 'AddressID'));
                var addressList = Underscore.filter(result[0].Items, function(address) {
                    if (searchAssigned.indexOf(address.ID) > -1) {
                        return address;
                    }
                });
                dfd.resolve(addressList);
            });
        return dfd.promise;
    }

    function BillingAddressList(term) {
        var dfd = $q.defer();
        var queue = [];
        queue.push(Addresses.List(term));
        queue.push(Addresses.ListAssignments(null, null, null, null, null, true));
        $q.all(queue)
            .then(function(result) {
                var searchAssigned = Underscore.intersection(Underscore.pluck(result[0].Items, 'ID'), Underscore.pluck(result[1].Items, 'AddressID'));
                var addressList = Underscore.filter(result[0].Items, function(address) {
                    if (searchAssigned.indexOf(address.ID) > -1) {
                        return address;
                    }
                });
                dfd.resolve(addressList);
            });
        return dfd.promise;
    }
}*/