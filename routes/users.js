var express = require('express');
const { NotExtended } = require('http-errors');
var router = express.Router();
var userHelper = require('../helpers/userhelper')
var productHelper = require('../helpers/producthelper')
var otpConfig = require('../config/otpconfig');
const userhelper = require('../helpers/userhelper');

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

  productHelper.getAllproducts().then(async (product) => {

    if (req.session.user) {

      let cart = await userHelper.fetchCartProd(req.session.user._id)

      res.render('user/user-home', { title: 'Homepage', isUser: true, user: req.session.user, product, cartCount: req.session.cartCount, cart });

    } else {

      res.render('user/user-home', { title: 'Homepage', isUser: true, product, cartCount: req.session.cartCount });

    }

  })

});

/* Home page-End */


/*log section-Start */

router.get('/otprequest', (req, res) => {

  res.render('user/otp-request', { title: 'OTP request', isUser: true, err: req.session.otpErr, forgotPass: req.session.forgPass })

  req.session.otpErr = false

})



router.post('/otprequest', (req, res) => {

  req.session.Mob = parseInt('' + req.body.countryCode + req.body.Pnum)
  req.session.Pnum = req.body.Pnum

  if (req.session.forgPass === false) {

    req.session.Signin = true

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
    err: req.session.verErr
  })
  req.session.mobile = false
  req.session.Pnum = false
  req.session.verErr = false

})

router.post('/otpverify', (req, res) => {

  otpClient.verify.services(otpConfig.serviceID)
    .verificationChecks.create({ to: '+' + req.body.Mob, code: req.body.Otp })
    .then((result) => {

      if (result.status == 'approved') {

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

        } else {
          req.session.forgPass = false
          res.render('user/reset-password', { title: 'Reset password', isUser: true })
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




router.get('/forgot-password', (req, res) => {

  req.session.forgPass = true
  res.redirect('/otprequest')


})

router.post('/reset-password', (req, res) => {

  userHelper.resetPass(req.body, req.session.UserId).then(() => {
    req.session.signupSucc = 'Password succesfully changed, Please log-in to continue'
    res.redirect('/login')
  })

})


router.get('/login', (req, res) => {
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
      res.redirect('/')

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


  await productHelper.fetchProduct(req.query.id).then(async (product) => {

    await productHelper.getRelproducts(product).then((relProduct) => {

      res.render('user/product-singleView', { title: product.Product_Name, isUser: true, user: req.session.user, product, relProduct, cartCount: req.session.cartCount });

    })

  })

});

router.get('/cart', verifyLog, cartCounter, async (req, res) => {

  let cartProd = await userHelper.fetchCartProd(req.session.user._id)
  let cartTotal = await userhelper.getTotalAmount(req.session.user._id)

  res.render('user/cart', { title: 'Cart', isUser: true, cartProd, user: req.session.user, cartCount: req.session.cartCount, cartTotal })

})

router.get('/add-to-cart/', verifyLog, (req, res) => {

  userHelper.addTocart(req.query.id, req.session.user._id, req.query.price).then(() => {
    res.json({ status: true })
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
    res.json(result)
  })
})

router.get('/checkout', verifyLog, cartCounter, async (req, res) => {
  let ctotal = await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/checkout', { title: 'Checkout', isUser: true, ctotal, user: req.session.user, cartCount: req.session.cartCount })
})

router.post('/place-order', async (req, res) => {
  let products = await userHelper.getCartProductList(req.session.user._id)
  let totalPrice = await userHelper.getTotalAmount(req.session.user._id)

  userHelper.placeOrder(req.body, products, totalPrice).then((orderId) => {

    if (req.body['Pay_Method'] == 'COD') {

      res.json({ codSuccess: true })

    } else if (req.body['Pay_Method'] == "Online") {

      userHelper.generateRazorpay(orderId, totalPrice).then((result) => {
        res.json(result)
      })

    } else {

      console.log("error");

    }

  })
})

router.get('/order-success', verifyLog, (req, res) => {

  userHelper.emptyCart(req.session.user._id).then(() => {

    res.render('user/order-success', { title: 'Order Placed', isUser: true, user: req.session.user, cartCount: 0 })
  })
})


router.get('/view-orders', verifyLog, cartCounter, async (req, res) => {

  await userHelper.getUserOrders(req.session.user._id).then(async (orders) => {

    let len = (orders.length) - 1
    let ProdsInOrder = await userHelper.getProdsInOrder(orders[len]._id)
    let Order = orders[len]

    res.render('user/orders', { title: 'Orders', isUser: true, user: req.session.user, ProdsInOrder, Order, cartCount: req.session.cartCount })
  })
})


router.post('/verify-payment', (req, res) => {

  userHelper.verifyPayment(req.body).then(() => {

    userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {

      console.log('Payment success')
      res.json({ status: true })

    })

  }).catch((err) => {

    console.log(err)
    res.json({ status: false })

  })

})


router.get('/all-orders', verifyLog, cartCounter, (req, res) => {

  userHelper.fetchAllUserOrders(req.session.user._id).then((allOrders) => {
    
    res.render('user/all-orders', { title: 'All-Orders', isUser: true, user: req.session.user, cartCount: req.session.cartCount,allOrders })

  })

})


router.get('/profile', verifyLog, cartCounter, (req, res) => {

  res.render('user/profile', { title: 'Profile', isUser: true, cartCount: req.session.cartCount, userData: req.session.user })

})


router.post('/updateprofile', (req, res) => {



  // userhelper.userProfileData(req.body).then(()=>{
  let id = (req.session.user._id)

  let Img = req.files.Dp

  Img.mv('./public/user-images/' + id + '_dp.jpg')
  // })

})

module.exports = router;

