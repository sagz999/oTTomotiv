var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/producthelper');
const userhelper = require('../helpers/userhelper');
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
router.get('/', verifyLog, async(req, res) => {

    let userCounts = await userHelper.totalUsersCount()
    let totalProducts = await userHelper.totalProdCount()
    let totalRevenue = await userHelper.totalRevenue()
    let orderCounts = await userHelper.orderCounts()
    let prodsInOrderCounts = await userHelper.prodsInOrderCounts()
    let ProdsStockCounts = await userHelper.ProdsStockCount()
    let payMethod = await userHelper.orderPaymentMethod()
    let orderCount = await userHelper.orderCount()

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


    res.render('admin/admin-dash', {
        title: 'Admin Dashboard',
        isAdmin: true,
        userCounts,
        totalProducts,
        totalRevenue,
        orderCounts,
        prodsInOrderCounts,
        ProdsStockCounts,
        payMethod,
        orderCount
    });

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

router.get('/edit-product/', verifyLog, async(req, res) => {

    let product = await productHelper.fetchProduct(req.query.id)
    let category = await productHelper.fetchCategories()
    let carBrand = await productHelper.fetchCarBrands()
    let prodBrand = await productHelper.fetchProdBrands()

    res.render('admin/edit-product', { title: 'Edit products', isAdmin: true, product, category, carBrand, prodBrand });


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

router.get('/add-product', verifyLog, async(req, res) => {

    let category = await productHelper.fetchCategories()
    let carBrand = await productHelper.fetchCarBrands()
    let prodBrand = await productHelper.fetchProdBrands()

    res.render('admin/add-product', { title: 'Add products', isAdmin: true, category, carBrand, prodBrand });

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


router.get('/order-details/', verifyLog, async(req, res) => {

    let order = await userHelper.getSpecificOrder(req.query.id)

    if (order.Mode === 'buynow') {

        res.render('admin/order-details', { title: 'Order details', order, isAdmin: true })

    } else {

        let prodsInOrder = await userHelper.getProdsInOrder(req.query.id)
        res.render('admin/order-details', { title: 'Order details', order, prodsInOrder, isAdmin: true })

    }


})


router.get('/active-users', verifyLog, (req, res) => {
    userHelper.fetchActiveUser().then((userdata) => {
        res.render('admin/active-users', { title: 'Active users', userdata, isAdmin: true })
    })
})

router.get('/blocked-users', verifyLog, (req, res) => {
    userHelper.fetchBlockedUser().then((userdata) => {
        res.render('admin/blocked-users', { title: 'Blocked users', userdata, isAdmin: true })
    })
})

router.get('/change-userstats/', verifyLog, (req, res) => {
    userHelper.changeUserStats(req.query.id).then(() => {

        res.json(true)

    })
})

router.get('/ad-management', verifyLog, async(req, res) => {

    let offers = await userHelper.fetchOffers()
    let Ads = await productHelper.fetchAllAds()

    res.render('admin/ad-management', { title: 'Ad Managemnet', isAdmin: true, offers, Ads, Msg: req.session.addMsg})
    req.session.addMsg = false
    

})

router.post('/add-newAd', verifyLog, (req, res) => {

    productHelper.addNewAd(req.body).then((id) => {

        let img = req.files.Img1

        img.mv('./public/Ad-Images/' + id + 'Ad_img.jpg')
        req.session.addMsg = 'ADDED NEW ADVERTISEMENT'
        res.redirect('/admin/ad-management')

    })
})

router.get('/delete-Ad/', verifyLog, (req, res) => {

    productHelper.delAd(req.query.adId).then(() => {

        res.json(true)

    })

})


router.post('/Change-orderStat/', (req, res) => {

    userHelper.changeOrderStats(
        req.query.orderId,
        req.query.prodId,
        req.body.status
    ).then(() => {

        res.json({ status: true })

    }).catch((error) => {
        console.log("error is:", error);

    })

})

router.post('/Change-buyNowOrderStat', (req, res) => {

    userHelper.changebuyNowOrderStat(
        req.body.orderId,
        req.body.status
    ).then(() => {

        res.json({ status: true })

    }).catch((error) => {
        console.log("error is:", error);
    })

})

router.get('/category', verifyLog, (req, res) => {

    productHelper.fetchCategories().then((Categories) => {

        res.render('admin/category', { title: 'Main Category', isAdmin: true, Msg: req.session.addMsg, Categories })
        req.session.addMsg = false

    })

})

router.post('/add-mainCat', (req, res) => {

    productHelper.addMainCategory(req.body).then(() => {

        req.session.addMsg = 'NEW MAIN CATEGORY ADDED'
        res.redirect('/admin/category')

    })


})



router.post('/add-subCat', (req, res) => {
    productHelper.addSubCategory(req.body).then((id) => {

        let img = req.files.Img1
        img.mv('./public/sub-category-images/' + id + 'SCI.jpg')
        req.session.addMsg = 'NEW SUB CATEGORY ADDED'
        res.redirect('/admin/category')
    })
})



router.get('/delete-category/', verifyLog, (req, res) => {
    productHelper.deleteCategory(req.query.id).then(() => {
        res.json(true)
    })
})

router.get('/delete-subCategory/', verifyLog, (req, res) => {

    productHelper.deleteSubCategory(req.query.catId, req.query.subCatId).then(() => {
        res.json(true)
    })
})

router.get('/car-brands', verifyLog, (req, res) => {

    productHelper.fetchCarBrands().then((carBrands) => {
        res.render('admin/car-brands', { title: 'Car Brands', isAdmin: true, Msg: req.session.addMsg, Err: req.session.delMsg, carBrands })
        req.session.addMsg = false
        req.session.delMsg = false
    })

})

router.post('/add-carBrand', (req, res) => {

    productHelper.addCarBrand(req.body).then((id) => {

        let img1 = req.files.Img1

        img1.mv('./public/car-brand-logos/' + id + 'CBL.jpg')

        req.session.addMsg = 'NEW CAR BRAND ADDED'
        res.redirect('/admin/car-brands')

    })
})

router.get('/delete-carBrand/', verifyLog, (req, res) => {
    productHelper.deleteCarBrand(req.query.id).then(() => {
        res.json(true)
    })
})

router.post('/add-carModel', (req, res) => {

    productHelper.addCarModel(req.body).then((id) => {

        let img = req.files.Img2
        img.mv('./public/car-model-images/' + id + 'CMI.jpg')

        req.session.addMsg = 'NEW CAR MODEL ADDED'
        res.redirect('/admin/car-brands')

    })
})

router.get('/delete-carModel/', (req, res) => {
    productHelper.deleteCarModel(req.query.brandId, req.query.modelId).then(() => {
        res.json(true)
    })
})

router.get('/product-brands', verifyLog, (req, res) => {
    productHelper.fetchProdBrands().then((prodBrands) => {
        res.render('admin/prod-brands', { title: 'Product Brands', isAdmin: true, Msg: req.session.addMsg, prodBrands })
        req.session.addMsg = false
    })

})

router.post('/add-prodBrand', (req, res) => {

    productHelper.addProdBrand(req.body).then((id) => {
        let img = req.files.Img1
        img.mv('./public/product-brand-logos/' + id + 'PBL.jpg')
        req.session.addMsg = 'NEW PRODUCT BRAND ADDED'
        res.redirect('/admin/product-brands')
    })

})

router.get('/delete-prodBrand/', verifyLog, (req, res) => {
    productHelper.deleteProdBrand(req.query.id).then(() => {
        res.json(true)
    })
})

router.get('/coupons', verifyLog, (req, res) => {

    userHelper.fetchCoupons().then((coupons) => {

        res.render('admin/coupons', { title: 'Coupon management', isAdmin: true, Msg: req.session.coupAddMsg, Err: req.session.coupDelMsg, coupons })
        req.session.coupAddMsg = false
        req.session.coupDelMsg = false

    })

})

router.post('/add-coupon', (req, res) => {
    userHelper.addnewCoupon(req.body).then(() => {
        req.session.coupAddMsg = 'NEW COUPON ADDED'
        res.redirect('/admin/coupons')
    })
})

router.get('/delete-coupon/', verifyLog, (req, res) => {
    userHelper.deleteCoupon(req.query.couponId).then(() => {
        req.session.coupDelMsg = 'COUPON DELETED'
        res.redirect('/admin/coupons')
    })
})

router.post('/fetchSubCat/', verifyLog, (req, res) => {
    productHelper.fetchSubCatList(req.query.MainCat).then((subCatList) => {

        res.json(subCatList)
    })
})

router.post('/fetchCarModels/', verifyLog, (req, res) => {
    productHelper.fetchCarModelList(req.query.CarBrand).then((carModelList) => {

        res.json(carModelList)
    })
})

router.get('/offers', verifyLog, async(req, res) => {
    let offers = await userHelper.fetchOffers()
    let Categories = await productHelper.fetchCategories()

    res.render('admin/offers', { title: 'Offers', isAdmin: true, offers, Categories })

})

router.get('/check-offer-exist/', verifyLog, (req, res) => {

    userHelper.checkOfferExist(req.query.subCat).then((response) => {

        if (response) {
            res.json(true)
        } else {
            res.json(false)
        }

    })

})

router.post('/add-new-offer', (req, res) => {
    userHelper.addNewOffer(req.body).then((products) => {

        products.map((SingleProd) => {
            userHelper.changeOfferProdPrice(SingleProd)
        })

        res.json(true)

    })
})

router.post('/delete-offer/', (req, res) => {

    userHelper.fetchAllProdInSubCatToUpdate(req.query.subCat).then((products) => {

        products.map((SingleProd) => {
            userHelper.updateEachProdBackToOrgPrice(SingleProd)
        })

        userHelper.deleteOffer(req.query.offerId).then(() => {
            res.json(true)
        })

    })

})

router.get('/All-orderReport', verifyLog, (req, res) => {

    userHelper.fetchTotalOrders().then((Allorders) => {
        let todayDate = new Date().toISOString().slice(0, 10)
        res.render('admin/all-orderReport', { title: 'All-Orders Report', isAdmin: true, Allorders, todayDate })
    })

})

router.get('/Placed-orderReport', verifyLog, (req, res) => {

    userHelper.fetchAllPlacedOrders().then((AllPlacedOrders) => {
        console.log(AllPlacedOrders)
        let todayDate = new Date().toISOString().slice(0, 10)
        res.render('admin/placed-orderReport', { title: 'Placed-Orders Report', isAdmin: true, AllPlacedOrders, todayDate })
    })

})

router.get('/Shipped-orderReport', verifyLog, (req, res) => {

    userHelper.fetchAllShippedOrders().then((AllShippedOrders) => {
        let todayDate = new Date().toISOString().slice(0, 10)
        res.render('admin/shipped-orderReport', { title: 'Shipped-Orders Report', isAdmin: true, AllShippedOrders, todayDate })
    })

})

router.get('/Delivered-orderReport', verifyLog, (req, res) => {

    userHelper.fetchAllDeliveredOrders().then((AllDeliveredOrders) => {
        let todayDate = new Date().toISOString().slice(0, 10)
        res.render('admin/delivered-orderReport', { title: 'Delivered-Orders Report', isAdmin: true, AllDeliveredOrders, todayDate })
    })

})

router.get('/Cancelled-orderReport', verifyLog, (req, res) => {

    userHelper.fetchAllCancelledOrders().then((AllCancelledOrders) => {
        let todayDate = new Date().toISOString().slice(0, 10)
        res.render('admin/cancelled-orderReport', { title: 'Cancelled-Orders Report', isAdmin: true, AllCancelledOrders, todayDate })
    })

})

router.post('/fetchSortedReports', async(req, res) => {

    var startDate = req.body.startDate
    var endDate = req.body.endDate

    if (req.body.source == 'AllOrders') {

        let allOrders = await userHelper.fetchTotalOrders()
        let filteredItems = await allOrders.filter((item, index) => item.Date >= startDate && item.Date <= endDate);

        let SortedArray = await filteredItems.sort((a, b) => {

            return new Date(b.Date) - new Date(a.Date);

        })

        let todaysDate = new Date().toISOString().slice(0, 10)

        res.render('admin/sorted-report', { title: 'All-orders Report', isAdmin: true, todaysDate, SortedArray, allOrders: true })

    } else if (req.body.source == 'PlacedOrders') {

        let allPlacedOrders = await userHelper.fetchAllPlacedOrders()
        let filteredItems = await allPlacedOrders.filter((item, index) => item.Date >= startDate && item.Date <= endDate);

        let SortedArray = await filteredItems.sort((a, b) => {

            return new Date(b.Date) - new Date(a.Date);

        })

        let todaysDate = new Date().toISOString().slice(0, 10)

        res.render('admin/sorted-report', { title: 'Placed-orders Report', isAdmin: true, todaysDate, SortedArray, allPlacedOrders: true })

    } else if (req.body.source == 'ShippedOrders') {

        let allShippedOrders = await userHelper.fetchAllShippedOrders()
        let filteredItems = await allShippedOrders.filter((item, index) => item.Date >= startDate && item.Date <= endDate);

        let SortedArray = await filteredItems.sort((a, b) => {

            return new Date(b.Date) - new Date(a.Date);

        })

        let todaysDate = new Date().toISOString().slice(0, 10)

        res.render('admin/sorted-report', { title: 'Shipped-orders Report', isAdmin: true, todaysDate, SortedArray, allShippedOrders: true })

    } else if (req.body.source == 'DeliveredOrders') {

        let allDeliveredOrders = await userHelper.fetchAllDeliveredOrders()
        let filteredItems = await allDeliveredOrders.filter((item, index) => item.Date >= startDate && item.Date <= endDate);

        let SortedArray = await filteredItems.sort((a, b) => {

            return new Date(b.Date) - new Date(a.Date);

        })

        let todaysDate = new Date().toISOString().slice(0, 10)

        res.render('admin/sorted-report', { title: 'Delivered-orders Report', isAdmin: true, todaysDate, SortedArray, allDeliveredOrders: true })

    } else if (req.body.source == 'CancelledOrders') {

        let allCancelledOrders = await userHelper.fetchAllCancelledOrders()
        let filteredItems = await allCancelledOrders.filter((item, index) => item.Date >= startDate && item.Date <= endDate);

        let SortedArray = await filteredItems.sort((a, b) => {

            return new Date(b.Date) - new Date(a.Date);

        })

        let todaysDate = new Date().toISOString().slice(0, 10)

        res.render('admin/sorted-report', { title: 'Cancelled-orders Report', isAdmin: true, todaysDate, SortedArray, allCancelledOrders: true })

    }

})

module.exports = router;