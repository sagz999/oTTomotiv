function addToCart(prodId, price, prodName) {


    $.ajax({

        url: '/add-to-cart?id=' + prodId + '&price=' + price + '&prodName=' + prodName,
        method: 'get',
        success: (response) => {

            if (response) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $("#cart-count").html(count)
                sessionStorage.setItem("cartreload", "true");
                location.reload();
            }

        }
    })

}

function cartNotification() {
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-bottom-right",
        "preventDuplicates": false,
        "onclick": function () {
            location.href = "/cart"
        },
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "3000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "show",
        "hideMethod": "hide"
    }
    toastr["success"]("Item added to cart")
}

function addToWishList(prodId) {

    $.ajax({
        url: '/addToWishlist?prodId=' + prodId,
        method: 'get',
        success: (result) => {
            sessionStorage.setItem("addwishlistreload", "true");
            location.reload();

        }
    })
}

function addWishNotification() {
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-bottom-right",
        "preventDuplicates": false,
        "onclick": function () {
            location.href = "/wishlist"
        },
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "3000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "show",
        "hideMethod": "hide"
    }
    toastr["success"]("Item added to wishlist")
}

function removeFromWish(prodId) {
    $.ajax({
        url: '/removeFromWish?prodId=' + prodId,
        method: 'get',
        success: (result) => {
            sessionStorage.setItem("removewishlistreload", "true");
            location.reload();
        }
    })
}

function removeWishNotification() {
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-bottom-right",
        "preventDuplicates": false,
        "onclick": function () {
            location.href = "/wishlist"
        },
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "3000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "show",
        "hideMethod": "hide"
    }
    toastr["error"]("Item removed from wishlist")
}

function deleteconfirm(cartId, prodId) {
    swal({
        title: "Are you sure?",
        text: "The product will be removed from your cart!",
        icon: "warning",
        buttons: true,
        dangerMode: true,
    }).then((willDelete) => {
            if (willDelete) {

                $.ajax({
                    url: '/remove-item?cartId=' + cartId + '&prodId=' + prodId,
                    method: 'get',
                    success: (result) => {
                        if (result) {
                            sessionStorage.setItem("cartProdDelReload", "true");
                            location.reload();
                        }
                    }
                })

            }
        });
}

function delCartProdNotification() {
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-bottom-right",
        "preventDuplicates": false,
        "onclick": false,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "3000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "show",
        "hideMethod": "hide"
    }
    toastr["error"]("Item removed from cart")
}
