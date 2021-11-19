var express = require('express');
const { NotExtended } = require('http-errors');
var router = express.Router();
var userHelper = require('../helpers/userhelper')
var productHelper = require('../helpers/producthelper')
var otpConfig = require('../config/otpconfig');
const userhelper = require('../helpers/userhelper');
const { v4: uuidv4 } = require('uuid');

const otpClient = require('twilio')(otpConfig.accountSID, otpConfig.authToken)

const verifyLog = (req, res, next) => {

  if (req.session.userLog) {

    next()

  } else {

    res.redirect('/login')

  }

}

const cartCounter = async (req, res, next) => {

  let cartCount = null

  if (req.session.user) {
   
    cartCount = await userHelper.getCartCount(req.session.user._id)
    req.session.cartCount = cartCount

  }
  next()

}

/* Home page-Start */

router.get('/', cartCounter, async (req, res) => {

  userHelper.checkOfferExpiry().then((offers) => {
    offers.map((eachOffers) => {

      userHelper.fetchAllProdInSubCatToUpdate(eachOffers.subCategory).then((products) => {

        products.map((SingleProd) => {
          userHelper.updateEachProdBackToOrgPrice(SingleProd)
        })

        userHelper.deleteOffer(eachOffers._id)

      })

    })

  })

  let product = await productHelper.getAllproducts()
  let carBrands = await productHelper.fetchCarBrands()
  let categories = await productHelper.fetchCategories()
  let Ads= await productHelper.fetchAllAds()
  let offerProds= await productHelper.fetchAllProdsUnderOffer()

  if (req.session.user) {
    
    var cart = await userHelper.fetchCartProd(req.session.user._id)

  } else {

    var cart = false

  }

  res.render('user/user-home', { title: 'Homepage', isUser: true, user: req.session.user, product, cartCount: req.session.cartCount, cart, carBrands, categories,Ads,offerProds });





});

/* Home page-End */


/*log section-Start */

router.get('/otprequest', (req, res) => {
  if (req.session.forgPass) {
    var forgotPass = true
  } else {
    var forgotPass = false
  }

  res.render('user/otp-request', { title: 'OTP request', isUser: true, err: req.session.otpErr, forgotPass })

  req.session.otpErr = false


})



router.post('/otprequest', (req, res) => {

  req.session.Mob = parseInt('' + req.body.countryCode + req.body.Pnum)
  req.session.Pnum = req.body.Pnum
  req.session.Ccode = req.body.countryCode
  req.session.resendMsg = false

  if (req.body.resend) {

    req.session.resendMsg = "OTP has been resend successfully"

  }

  userHelper.checkNum(req.body).then((result) => {

    req.session.UserId = result._id

    if (result) {

      if (result.Status) {

        otpClient.verify.services(otpConfig.serviceID)
          .verifications.create({ to: '+' + req.session.Mob, channel: 'sms' })
          .then(() => {


            res.redirect('/otpverify')

          })
          .catch((err) => {

            console.log("OTP error", err)
            req.session.otpErr = "Unable to generate OTP, please try after sometime"
            res.redirect('/otprequest')

          })

      } else {

        req.session.otpErr = "Entry restricted"

        res.redirect('/otprequest')

      }
    } else {

      req.session.otpErr = "Phone number doesn't exist"
      res.redirect('/otprequest')

    }
  })

})

router.get('/otpverify', (req, res) => {




  res.render('user/otp-verify', {
    title: 'Verification',
    isUser: true,
    mobile: req.session.Mob,
    Pnum: req.session.Pnum,
    Ccode: req.session.Ccode,
    err: req.session.verErr,
    Msg: req.session.resendMsg
  })


  req.session.verErr = false



})

router.post('/otpverify', (req, res) => {

  otpClient.verify.services(otpConfig.serviceID)
    .verificationChecks.create({ to: '+' + req.body.Mob, code: req.body.Otp })
    .then((result) => {

      if (result.status == 'approved') {

        req.session.mobile = false
        req.session.Pnum = false
        req.session.Ccode = false

        if (req.session.Signin) {
          userHelper.fetchOtpuser(req.body.Pnum).then((user) => {

            req.session.Signin = false
            req.session.user = user
            req.session.userLog = true
            res.redirect('/')

          })

        } else if (req.session.Signup) {

          userHelper.insertNewUser(req.session.newUserData).then(() => {

            req.session.Signup = false
            req.session.newUserData = false
            req.session.signupSucc = "Sign-up successfull, Please sign-in to continue"
            res.redirect('/login')

          })

        } else if (req.session.forgPass) {
          res.render('user/reset-password', { title: 'Reset password', isUser: true })
          req.session.forgPass = false
        }

      } else {


        req.session.verErr = 'Invalid OTP'
        res.redirect('/otpverify')

      }

    })
    .catch((err) => {

      req.session.verErr = 'Unexpected error, please try after sometime'
      res.redirect('/otpverify')

    })
})


router.get('/otp-signin', (req, res) => {
  req.session.Signin = true
  req.session.forgPass = false
  res.redirect('/otprequest')
})

router.get('/forgot-password', (req, res) => {
  req.session.Signin = false
  req.session.forgPass = true
  res.redirect('/otprequest')
})

router.post('/reset-password', (req, res) => {

  userHelper.resetPass(req.body, req.session.UserId).then(() => {
    req.session.signupSucc = 'Password succesfully changed, Please log-in to continue'
    res.redirect('/login')
  })

})


router.get('/login/', (req, res) => {

  if (req.query.guestRedirect) {

    if (req.query.token == 'guestToBuyNow') {

      req.session.buyNowStatus = true
      req.session.buyNowProdId = req.query.prodId

    } else if (req.query.token == 'guestToCart') {

      req.session.cartStatus = true
      req.session.cartProdId = req.query.prodId
      req.session.cartProdPrice = req.query.prodPrice
      req.session.cartProdName = req.query.prodName

    } else if (req.query.token == 'guestToCartPage') {

      req.session.guestToCart = true

    } else if (req.query.token == 'guestToWishlist') {

      req.session.guestToWishlist = true

    } else if (req.query.token == 'guestToAddWishlist') {

      req.session.guestToAddWishlist = true
      req.session.wishlistProdId = req.query.prodId

    }

  }

  if (req.session.userLog) {
    res.redirect('/')
  } else {
    res.render('user/user-login', { title: 'Login', isUser: true, err: req.session.Err, msg: req.session.signupSucc })
    req.session.Err = false
    req.session.signupSucc = false
  }


});

router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((result) => {

    if (result.status) {

      //if login success
      req.session.user = result.user
      req.session.userLog = true

      if (req.session.buyNowStatus) {

        res.redirect('/prodBuyNow?prodId=' + req.session.buyNowProdId)
        req.session.buyNowStatus = false
        req.session.buyNowProdId = false

      } else if (req.session.cartStatus) {

        res.redirect('/add-to-cart?id=' + req.session.cartProdId + '&price=' + req.session.cartProdPrice + '&prodName=' + req.session.cartProdName)
        req.session.cartProdId = false
        req.session.cartProdPrice = false
        req.session.cartProdName = false

      } else if (req.session.guestToCart) {

        res.redirect('/cart')
        req.session.guestToCart = false

      } else if (req.session.guestToWishlist) {

        res.redirect('/wishlist')
        req.session.guestToWishlist = false

      } else if (req.session.guestToAddWishlist) {

        res.redirect('/addToWishlist?prodId=' + req.session.wishlistProdId)

      } else {

        res.redirect('/')

      }

    } else {
      //if login error
      req.session.Err = result.Err
      res.redirect('/login')

    }
  })

})



router.get('/signup', (req, res) => {
  res.render('user/user-signup', { title: 'Signup', isUser: true, err: req.session.signupErr })
  req.session.signupErr = false
});



router.post('/signup', (req, res) => {

  userHelper.doSignup(req.body).then((response) => {

    if (response.status === false) {

      req.session.signupErr = response.errMsg
      res.redirect('/signup')

    } else {

      req.session.Mob = parseInt('' + req.body.countryCode + req.body.Pnum)
      req.session.Pnum = req.body.Pnum
      req.session.Signup = true
      req.session.Signin = false
      req.session.forgPass = false
      req.session.newUserData = req.body



      otpClient.verify.services(otpConfig.serviceID)
        .verifications.create({ to: '+' + req.session.Mob, channel: 'sms' })
        .then(() => {

          res.redirect('/otpverify')

        })
        .catch((err) => {

          console.log("OTP error", err)
          req.session.signupErr = "Unable to generate OTP, please try after sometime"
          res.redirect('/signup')

        })

    }
  })

})

router.get('/logout', (req, res) => {
  req.session.userLog = false
  req.session.user = false
  req.session.cartCount = false
  res.redirect('/')
})

/*log section-End */


//Product single-View

router.get('/view-product/', cartCounter, async (req, res) => {


  let product = await productHelper.fetchProduct(req.query.id)
  let relProduct = await productHelper.getRelproducts(product.Sub_Category)
  let review = await userHelper.fetchReviews(req.query.id)
  var reviewCount

  if (review) {

    var reviewExist
    reviewCount = review.prodReview.length
    if (reviewCount > 0) {

      reviewExist = true

    } else {

      reviewExist = false

    }

  } else {

    reviewCount = 0

  }

  if (req.session.user) {

    var cart = await userHelper.fetchCartProd(req.session.user._id)
    var wishlist = await userHelper.fetchWishlist(req.session.user._id)
    var userPurchasedItem = await userHelper.checkUserPurchasedItem(req.session.user._id, req.query.id)

    if (userPurchasedItem) {

      var checkUserCmmnts = await userHelper.checkUserCmmnts(req.query.id, req.session.user._id)

    }

  } else {

    var cart = false
    var wishlist = false
    var userPurchasedItem = false
    var checkUserCmmnts = false

  }

  res.render('user/product-singleView', { title: product.Product_Name, isUser: true, user: req.session.user, product, relProduct, cartCount: req.session.cartCount, cart, wishlist, review, userPurchasedItem, checkUserCmmnts, reviewExist, reviewCount });

});

router.get('/cart', verifyLog, cartCounter, async (req, res) => {

  let cartProd = await userHelper.fetchCartProd(req.session.user._id)
  let cartTotal = await userhelper.getTotalAmount(req.session.user._id)

  res.render('user/cart', { title: 'Cart', isUser: true, cartProd, user: req.session.user, cartCount: req.session.cartCount, cartTotal })

})

router.get('/add-to-cart/', verifyLog, (req, res) => {

  userHelper.addTocart(req.query.id, req.session.user._id, req.query.price, req.query.prodName).then(() => {
    if (req.session.cartStatus) {
      res.redirect('/cart')
      req.session.cartStatus = false
    } else {
      res.json(true)
    }

  })
})

router.post('/change-product-quantity', (req, res, next) => {

  userHelper.changeProdQty(req.body).then(async (response) => {
    response.ctotal = await userHelper.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.get('/remove-item/', verifyLog, (req, res) => {

  userHelper.removeItem(req.query.cartId, req.query.prodId).then((result) => {
    res.json(true)
  })
})

router.get('/cartCheckout', verifyLog, cartCounter, async (req, res) => {

  let ctotal = await userHelper.getTotalAmount(req.session.user._id)
  let address = await userHelper.fetchUserAddress(req.session.user._id)
  res.render('user/cartCheckout', { title: 'Checkout', isUser: true, ctotal, user: req.session.user, cartCount: req.session.cartCount, address })

})

router.post('/cartPlaceOrder', async (req, res) => {

  var products = await userHelper.getCartProductList(req.session.user._id)
  req.session.totalPrice = req.body.totalfinalPrice
  req.session.refId = uuidv4()
  req.session.orderData = req.body

  if (req.body.saveAddress == 'on') {
    await userHelper.addNewAddress(req.body, req.session.user._id)
  }

  if (req.body.Pay_Method == 'COD') {

    userHelper.placeOrder(req.body, products, req.body.totalfinalPrice, req.session.refId).then((orderId) => {
      req.session.orderId = orderId
      products.map((data) => {
        productHelper.cartStockUpdate(data)
      })

      req.session.totalPrice = false
      req.session.refId = false
      req.session.orderData = false

      res.json({ codSuccess: true })
    })

  } else if (req.body.Pay_Method == "Razorpay") {
    
    userHelper.generateRazorpay(req.session.refId, req.body.totalfinalPrice).then((result) => {

      let userData = {
        Name: req.session.user.Username,
        Phone: req.session.user.Pnum,
        Email: req.session.user.Email
      }

      res.json({ result, userData })
    })

  } else if (req.body.Pay_Method == "PayPal") {

    userHelper.generatePaypal(req.session.refId, req.body.usdToInr).then((paySuccess) => {

      userHelper.placeOrder(req.body, products, req.body.totalfinalPrice, req.session.refId).then((orderId) => {
        req.session.orderId = orderId

        products.map((data) => {
          productHelper.cartStockUpdate(data)
        })

        req.session.refId = false
        req.session.orderData = false
        req.session.totalPrice = false

        res.json(paySuccess)

      })

    }).catch((err) => {

      console.log('PayPal Err:', err)

    })

  }

})


router.get('/prodBuyNow/', verifyLog, cartCounter, (req, res) => {
  productHelper.fetchProduct(req.query.prodId).then(async (product) => {
    req.session.prod = product
    let address = await userHelper.fetchUserAddress(req.session.user._id)
    res.render('user/buyNowCheckout', { title: 'Checkout', isUser: true, product, user: req.session.user, cartCount: req.session.cartCount, address })

  })
})


router.post('/buyNowPlaceOrder', async (req, res) => {


  var price = req.body.totalfinalPrice
  req.session.refId = uuidv4()
  req.session.orderData = req.body

  if (req.body.saveAddress == 'on') {
    await userHelper.addNewAddress(req.body, req.session.user._id)
  }

  if (req.body.Pay_Method == 'COD') {

    userHelper.buyNowPlaceOrder(req.body, req.session.prod, req.session.refId).then((orderId) => {

      req.session.orderId = orderId
      productHelper.buyNowStockUpdate(req.session.prod._id).then(() => {
        req.session.refId=false
        req.session.prod=false
        req.session.orderData=false

        res.json({ codSuccess: true })
      })

    })

  } else if (req.body.Pay_Method == "Razorpay") {
    userHelper.generateRazorpay(req.session.refId, price).then((result) => {

      let userData = {
        Name: req.session.user.Username,
        Phone: req.session.user.Pnum,
        Email: req.session.user.Email
      }

      res.json({ result, userData })
    })

  } else if (req.body.Pay_Method == "PayPal") {

    userHelper.generatePaypal(req.session.refId, req.body.usdToInr).then((paySuccess) => {

      userHelper.buyNowPlaceOrder(req.body, req.session.prod, req.session.refId).then((orderId) => {
        req.session.orderId = orderId

        productHelper.buyNowStockUpdate(req.session.prod._id).then(() => {
          
          req.session.prod = false
          req.session.refId = false
          req.session.orderData=false
          
          res.json(paySuccess)
          
        })

      })

    }).catch((err) => {

      console.log('PayPal Err:', err)

    })

  }



})


router.get('/buyNowOrder-success', verifyLog, cartCounter, (req, res) => {

  res.render('user/order-success', { title: 'Order Placed', isUser: true, user: req.session.user, cartCount: req.session.cartCount })

})


router.get('/cartOrder-success', verifyLog, (req, res) => {

  userHelper.emptyCart(req.session.user._id).then(() => {

    res.render('user/order-success', { title: 'Order Placed', isUser: true, user: req.session.user, cartCount: 0 })
  })

})

router.get('/view-orderSummary', verifyLog, cartCounter, (req, res) => {
  userHelper.getSpecificOrder(req.session.orderId).then((order) => {
    res.render('user/order-summary', { title: 'Order Summary', isUser: true, user: req.session.user, cartCount: req.session.cartCount, order })
    req.session.orderId = false

  })

})

router.post('/verify-payment', (req, res) => {

  userHelper.verifyPayment(req.body).then(() => {
    res.json({ status: true })

  }).catch((err) => {

    console.log('RazorPayErr:', err)
    res.json({ status: false })

  })

})

router.get('/placeOrderBuyNow', verifyLog, (req, res) => {
  userHelper.buyNowPlaceOrder(req.session.orderData, req.session.prod, req.session.refId).then((orderId) => {
    req.session.orderId = orderId
  
    productHelper.buyNowStockUpdate(req.session.prod._id).then(() => {
      req.session.orderData = false
      req.session.prod = false
      req.session.refId = false
      res.redirect('/buyNowOrder-success')
      
    })


  })
})

router.get('/placeOrderCart', verifyLog,async (req, res) => {

  var products = await userHelper.getCartProductList(req.session.user._id)
  userHelper.placeOrder(req.session.orderData,products, req.session.totalPrice, req.session.refId).then((orderId) => {
    req.session.orderId = orderId

    products.map((data) => {
      productHelper.cartStockUpdate(data)
    })

    req.session.orderData = false
    req.session.refId = false
    req.session.totalPrice = false

    res.redirect('/cartOrder-success')

  })
})


router.get('/all-orders', verifyLog, cartCounter, (req, res) => {

  userHelper.fetchAllUserOrders(req.session.user._id).then((allOrders) => {

    res.render('user/orders', { title: 'All-Orders', isUser: true, user: req.session.user, cartCount: req.session.cartCount, allOrders })

  })

})


router.get('/profile', verifyLog, cartCounter, (req, res) => {

  userHelper.fetchUserDetails(req.session.user._id).then((userData) => {

    userHelper.fetchUserAddress(userData._id).then((address) => {

      res.render('user/profile', { title: 'Profile', isUser: true, cartCount: req.session.cartCount, user: userData, address, Err: req.session.errMsg, Msg: req.session.succMsg })
      req.session.errMsg = false
      req.session.succMsg = false

    })

  })

})




router.post('/update-profile', (req, res) => {

  userHelper.updateUserProfile(req.session.user._id, req.body).then((id) => {

    if (req.files) {
      let Img = req.files.userImage
      Img.mv('./public/user-images/' + id + '_dp.jpg')
      req.session.succMsg = "PROFILE UPDATED"
      res.redirect('/profile')

    } else {
      req.session.succMsg = "PROFILE UPDATED"
      res.redirect('/profile')

    }

  })

})




router.post('/cancelProdInOrder', (req, res) => {

  userHelper.changeOrderStats(

    req.body.orderId,
    req.body.prodId,
    req.body.status,
    req.body.quantity

  ).then(() => {

    res.json({ status: true })

  })

})


router.post('/cancelBuyNowOrder', (req, res) => {


  userHelper.changebuyNowOrderStat(
    req.body.orderId,
    req.body.status,
    req.body.prodId
  ).then(() => {

    res.json({ status: true })

  })

})


router.post('/addNewAddress', (req, res) => {
  userHelper.addNewAddress(req.body, req.session.user._id).then(() => {
    req.session.succMsg = 'ADDED NEW ADDRESS'
    res.redirect('/profile')
  })
})

router.get('/delete-address/', verifyLog, (req, res) => {
  userHelper.deleteAddress(req.session.user._id, req.query.id).then(() => {
    req.session.errMsg = 'ADDRESS DELETED'
    res.redirect('/profile')
  })
})

router.get('/edit-address/', verifyLog, cartCounter, (req, res) => {

  userHelper.fetchAddressToEdit(req.session.user._id, req.query.id).then((address) => {

    res.render('user/edit-address', { title: 'Edit-Address', isUser: true, user: req.session.user, cartCount: req.session.cartCount, address })

  })



})

router.post('/edit-address', (req, res) => {
  userHelper.editAddress(req.session.user._id, req.body, req.body.addressId).then(() => {
    req.session.succMsg = 'ADDRESS UPDATED'
    res.redirect('/profile')
  })
})

router.get('/get-orderInvoice/', verifyLog, cartCounter, (req, res) => {
  userHelper.getSpecificOrder(req.query.orderId).then((order) => {
    if (order.Mode == 'buynow') {
      res.render('user/order-invoice', { title: 'Product Invoice', isUser: true, user: req.session.user, cartCount: req.session.cartCount, order })
    } else {

      let prodId = req.query.prodId
      let products = order.Products
      for (key in products) {
        if (products[key].item.toString() == prodId.toString()) {

          res.render('user/order-invoice', { title: 'Product Invoice', isUser: true, user: req.session.user, cartCount: req.session.cartCount, order, product: products[key] })
        }
      }


    }

  })
})

router.get('/checkCouponBuyNow/', verifyLog, (req, res) => {
  userHelper.checkCouponCode(req.query.couponCode, req.query.price, req.session.user._id).then((response) => {

    res.json(response)

  })
})

router.get('/checkCouponCart/', verifyLog, (req, res) => {

  userHelper.checkCouponCode(req.query.couponCode, req.query.price, req.session.user._id).then((response) => {

    res.json(response)

  })

})

router.get('/chooseCarModel/', cartCounter, (req, res) => {
  productHelper.fetchCarModel(req.query.brandId).then((carBrand) => {
    res.render('user/select-car-model', { title: 'Select car model', isUser: true, user: req.session.user, cartCount: req.session.cartCount, carBrand })
  })
})

router.get('/shop', cartCounter, async (req, res) => {

  let prodBrands = await productHelper.fetchProdBrands()
  let categories = await productHelper.fetchCategories()
  let products = await productHelper.getAllproducts()

  if (req.session.user) {
    let cart = await userHelper.fetchCartProd(req.session.user._id)
    res.render('user/shop-all', { title: 'Shop', isUser: true, user: req.session.user, cartCount: req.session.cartCount, prodBrands, categories, products, cart })
  } else {

    res.render('user/shop-all', { title: 'Shop', isUser: true, user: req.session.user, cartCount: req.session.cartCount, prodBrands, categories, products })
  }

})

router.get('/addToWishlist/', verifyLog, cartCounter, (req, res) => {
  userHelper.addToWishlist(req.session.user._id, req.query.prodId).then((result) => {
    if (req.session.guestToAddWishlist) {

      res.redirect('/view-product?id=' + req.session.wishlistProdId)
      req.session.guestToAddWishlist = false
      req.session.wishlistProdId = false

    } else {

      res.json(result)

    }

  })
})

router.get('/removeFromWish/', verifyLog, cartCounter, (req, res) => {
  userHelper.removeFromWishlist(req.session.user._id, req.query.prodId).then((result) => {
    res.json(result)
  })
})

router.get('/wishlist', verifyLog, cartCounter, (req, res) => {
  userHelper.fetchWishlist(req.session.user._id).then(async (wishlistProds) => {
    let cart = await userHelper.fetchCartProd(req.session.user._id)
    res.render('user/wishlist', { title: 'wishlist', isUser: true, user: req.session.user, cartCount: req.session.cartCount, wishlistProds, cart })
  })
})

router.post('/currencycoverter/', (req, res) => {
  userHelper.convertAmount(req.query.amount).then((convertedAmount) => {
    res.json(convertedAmount)
  })
})

router.post('/post-review', (req, res) => {
  userHelper.addReview(req.body).then(() => {
    res.json(true)
  })
})

router.post('/delete-review', (req, res) => {
  userHelper.deleteReview(req.query.prodId, req.query.userId).then(() => {
    res.json(true)
  })
})

router.post('/post-edited-review', (req, res) => {
  userHelper.editReview(req.body).then(() => {
    res.json(true)
  })
})

router.post('/search', (req, res) => {
  userHelper.fetchSearchMatchProds(req.body).then((products) => {
    res.json(products)
  })
})

router.get('/all-brands',cartCounter, (req, res) => {
  productHelper.fetchCarBrands().then((carBrands) => {
    res.render('user/select-car-brand', { title: 'Select car brand', isUser: true, user: req.session.user, cartCount: req.session.cartCount, carBrands })
  })
})

router.get('/shopByCat/',cartCounter, (req, res) => {

  productHelper.getRelproducts(req.query.subCat).then(async (products) => {
    if(req.session.userLog){
      var cart = await userHelper.fetchCartProd(req.session.user._id)
    }else{
      var cart=false
    }
    
    let catName = req.query.subCat
    res.render('user/shop-by-category', { title: 'Shop by category', isUser: true, user: req.session.user, cartCount: req.session.cartCount, products, cart, catName })
  })

})

router.get('/shopByProdBrand/',cartCounter, (req, res) => {
  productHelper.fetchProdsUnderBrand(req.query.prodBrand).then(async (resultObj) => {
    let prodBrandData = resultObj.prodBrandData
    let products = resultObj.products

    if(req.session.userLog){
      var cart = await userHelper.fetchCartProd(req.session.user._id)
    }else{
      var cart=false
    }

    res.render('user/products-from-brand', { title: 'Shop by Brand', isUser: true, user: req.session.user, cartCount: req.session.cartCount, products, cart, prodBrandData })
  })
})

router.get('/shop-by-car-model/',cartCounter, (req, res) => {

  productHelper.fetchProdsUnderCarModel(req.query.carModel).then(async (products) => {
    if(req.session.userLog){
      var cart = await userHelper.fetchCartProd(req.session.user._id)
    }else{
      var cart=false
    }
    let carModelId = req.query.carModelId
    let carModelName = req.query.carModel
    res.render('user/shop-by-car', { title: 'Shop by Car', isUser: true, user: req.session.user, cartCount: req.session.cartCount, products, cart, carModelId, carModelName })

  })
})

router.get('/shop-by-offer/',cartCounter,(req,res)=>{

  productHelper.fetchProdsUnderSpecificOffer(req.query.offerName).then(async(products)=>{
    if(req.session.userLog){
      var cart = await userHelper.fetchCartProd(req.session.user._id)
    }else{
      var cart=false
    }
    res.render('user/shop-by-offer',{title:'Shop by Offer',isUser:true,user:req.session.user,cartCount: req.session.cartCount, products, cart,offerName:req.query.offerName})
  })

})

router.get('/choose-category',cartCounter, async (req, res) => {

  let category = await productHelper.fetchCategories()
  res.render('user/choose-category', { title: 'Choose category', isUser: true, user: req.session.user, cartCount: req.session.cartCount, category })
})





module.exports = router;

