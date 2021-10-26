var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/producthelper');
var userHelper = require('../helpers/userhelper')


var credentials = {
  username: 'sagar',
  password: 4253
}

const verifyLog = (req, res, next) => {
  if (req.session.adminLog) {
    next()
  } else {
    res.redirect('/admin/login')
  }
}

/* GET home page. */
router.get('/', verifyLog, (req, res) => {

  res.render('admin/admin-dash', { title: 'Admin Dashboard', isAdmin: true });

});

router.get('/all-users', verifyLog, (req, res) => {

  userHelper.showallUser().then((userdata) => {
    res.render('admin/view-users', { title: 'All users', isAdmin: true, userdata });
  })

})

router.get('/view-products', verifyLog, (req, res) => {

  productHelper.getAllproducts().then((products) => {
    res.render('admin/view-products', { title: 'All products', isAdmin: true, products });
  })

});

router.get('/delete-product/:id', verifyLog, (req, res) => {

  let prodId = req.params.id
  productHelper.deleteProduct(prodId).then((response) => {
    res.redirect('/admin/view-products')
  })


});

router.get('/edit-product/', verifyLog, async (req, res) => {

  let product = await productHelper.fetchProduct(req.query.id)
  res.render('admin/edit-product', { title: 'Edit products', isAdmin: true, product });


});

router.post('/edit-product/:id', (req, res) => {
  let id = req.params.id
  productHelper.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin/view-products')
    if (req.files.Img1 || req.files.Img2 || req.files.Img3 || req.files.Img4) {

      let img1 = req.files.Img1
      let img2 = req.files.Img2
      let img3 = req.files.Img3
      let img4 = req.files.Img4

      img1.mv('./public/product-images/' + id + '_1.jpg')
      img2.mv('./public/product-images/' + id + '_2.jpg')
      img3.mv('./public/product-images/' + id + '_3.jpg')
      img4.mv('./public/product-images/' + id + '_4.jpg')

    }
  })
})

router.get('/add-product', verifyLog, async (req, res) => {

  let Categories = await productHelper.fetchCategories()

  res.render('admin/add-product', { title: 'Add products', isAdmin: true, Categories });

});

router.post('/add-product', (req, res) => {
  productHelper.addProduct(req.body).then((id) => {
    let img1 = req.files.Img1
    let img2 = req.files.Img2
    let img3 = req.files.Img3
    let img4 = req.files.Img4

    img1.mv('./public/product-images/' + id + '_1.jpg')
    img2.mv('./public/product-images/' + id + '_2.jpg')
    img3.mv('./public/product-images/' + id + '_3.jpg')
    img4.mv('./public/product-images/' + id + '_4.jpg')

    res.redirect('/admin/view-products')
  })
})

router.get('/login', (req, res) => {
  if (req.session.adminLog) {

    res.redirect('/admin')

  } else {
    res.render('admin/admin-login', { title: 'Admin login', isUser: true, err: req.session.adminloginError });
    req.session.adminloginError = false

  }


})

router.post('/login', (req, res) => {

  if (req.body.Username == credentials.username && req.body.Password == credentials.password) {
    req.session.admin = req.body.username;
    req.session.adminLog = true;
    res.redirect('/admin')

  } else {
    req.session.adminloginError = "Invalid entry"
    res.redirect('/admin/login')
  }

})

router.get('/logout', (req, res) => {
  req.session.adminLog = false;
  res.redirect('/admin');
})

router.get('/orders', verifyLog, (req, res) => {

  userHelper.getAllOrders().then((orders) => {

    res.render('admin/view-orders', { title: 'Orders', isAdmin: true, orders })
  })

})


router.get('/order-details/', verifyLog, async (req, res) => {

  let order = await userHelper.getSpecificOrder(req.query.id)
  let prodsInOrder = await userHelper.getProdsInOrder(req.query.id)
  res.render('admin/order-details', { title: 'Order details', order, prodsInOrder, isAdmin: true })

})


router.get('/active-users', (req, res) => {
  userHelper.fetchActiveUser().then((userdata) => {
    res.render('admin/active-users', { title: 'Active users', userdata, isAdmin: true })
  })
})

router.get('/blocked-users', (req, res) => {
  userHelper.fetchBlockedUser().then((userdata) => {
    res.render('admin/blocked-users', { title: 'Blocked users', userdata, isAdmin: true })
  })
})

router.get('/change-userstats/', (req, res) => {
  userHelper.changeUserStats(req.query.id).then(() => {

    switch (req.query.origin) {

      case 'main':

        res.redirect('/admin/all-users')
        break;

      case 'blocked':

        res.redirect('/admin/blocked-users')
        break;

      case 'active':

        res.redirect('/admin/active-users')
        break;

      default:
        console.log("I'm from default")

    }

  })
})


router.post('/Change-orderStat/', (req, res) => {

  userHelper.changeOrderStats(
    req.query.orderId,
    req.query.prodId,
    req.body.status
  ).then(() => {

    res.json()

  }).catch((error) => {
    console.log("error is:", error);

  })

})

router.get('/categories', (req, res) => {

  productHelper.fetchCategories().then((Categories) => {

    res.render('admin/categories', { title: 'Add Category', isAdmin: true, Msg: req.session.addMsg, Err: req.session.delMsg, Categories })
    req.session.addMsg = false
    req.session.delMsg = false

  })

})

router.post('/add-cat', (req, res) => {

  productHelper.addCategory(req.body).then(() => {

    req.session.addMsg = 'NEW CATEGORY ADDED'
    res.redirect('/admin/categories')

  })


})


router.get('/delete-category/', (req, res) => {
  productHelper.deleteCategory(req.query.id).then(() => {
    req.session.delMsg = 'CATEGORY DELETED'
    res.redirect('/admin/categories')
  })
})

router.get('/add-vehicle', (req, res) => {
  res.render('admin/add-vehicle', { title: 'Add vehicle', isAdmin: true })
})

router.post('/add-carBrand', (req, res) => {

  productHelper.addCarBrand(req.body).then((id) => {

    let img1 = req.files.Img1
    img1.mv('./public/brand-logos/' + id + '_1.jpg')

    // req.session.addMsg = 'NEW CAR BRAND ADDED'
    // res.redirect('/admin/add-vehicle')

  })
})

module.exports = router;
