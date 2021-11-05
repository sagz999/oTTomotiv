
function changeQty(cartId, prodId, count, price, userId) {

    let quantity = parseInt(document.getElementById(prodId).innerHTML)

    count = parseInt(count)
    price = parseInt(price)
    id = prodId + '1'

    $.ajax({
        url: '/change-product-quantity',
        data: {
            user: userId,
            cart: cartId,
            product: prodId,
            count: count,
            quantity: quantity,
            price: price
        },
        method: 'post',
        success: (response) => {
            if (response.removeProd) {
                alert("Product removed from cart")
                location.reload()
            } else {
                document.getElementById(prodId).innerHTML = quantity + count
                document.getElementById(id).innerHTML = (quantity + count) * price
                document.getElementById('ctotal').innerHTML = response.ctotal
            }
        }
    })
}

function deleteProd(cartId, prodId) {

    $.ajax({
        url: '/remove-item?cartId=' + cartId + '&prodId=' + prodId,
        method: 'get',
        success: (result) => {
            if (result.removeItem) {
                location.reload()
            } else {
                console.log('Failed to remove product')
            }
        }
    })
}

