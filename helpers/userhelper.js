var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId

const crypto = require('crypto')

const Razorpay = require('razorpay')
var paypal = require('paypal-rest-sdk');
const { resolve } = require('path')
const { v4: uuidv4 } = require('uuid');
const { info } = require('console')
const axios = require('axios')
const ACCESS_KEY = process.env.ACCESS_KEY

var instance = new Razorpay({
    key_id: process.env.razorPayKey_id,
    key_secret: process.env.razorPayKey_secret,
});

paypal.configure({

    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.payPalClient_id,
    'client_secret': process.env.payPalClient_secret

});

module.exports = {

    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {

            let response = {}

            let userVar = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })

            if (userVar === null) {

                let userNum = await db.get().collection(collection.USER_COLLECTION)
                    .findOne({ $and: [{ countryCode: userData.countryCode }, { Pnum: userData.Pnum }] })

                if (userNum === null) {

                    response.status = true
                    resolve(response)

                } else {

                    response.status = false
                    response.errMsg = "Mobile number already registered"
                    resolve(response)

                }


            } else {

                response.status = false
                response.errMsg = "User already exist"
                resolve(response)

            }

        })
    },


    insertNewUser: (userData) => {

        return new Promise(async (resolve, reject) => {

            userData.Password = await bcrypt.hash(userData.Password, 10)

            userData.Status = true

            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data)
            })
        })
    },

    checkPass: (pass, userId) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
                bcrypt.compare(pass, user.Password).then((result) => {
                    if (result) {
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                })
            })

        })

    },

    resetPass: (newPass, userId) => {

        return new Promise(async (resolve, reject) => {

            newPass.Password = await bcrypt.hash(newPass.Password, 10)

            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $set: {
                        Password: newPass.Password
                    }
                }).then(() => {
                    resolve()
                })
        })
    },

    changePass: (newPass, userId) => {

        return new Promise(async (resolve, reject) => {

            newPass.NewPassword = await bcrypt.hash(newPass.NewPassword, 10)

            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $set: {
                        Password: newPass.NewPassword
                    }
                }).then(() => {
                    resolve()
                })
        })
    },

    doLogin: (loginData) => {

        return new Promise(async (resolve, reject) => {

            let response = {}

            let userCheck = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: loginData.Email })

            if (userCheck) {

                if (userCheck.Status) {

                    bcrypt.compare(loginData.Password, userCheck.Password).then((status) => {

                        if (status) {

                            response.user = userCheck
                            response.status = true
                            resolve(response)

                        } else {

                            response.status = false
                            response.Err = "Incorrect password"
                            resolve(response)

                        }

                    })

                } else {

                    response.status = false
                    response.Err = "Entry restricted"
                    resolve(response)

                }
            } else {

                response.status = false
                response.Err = "Invalid user"
                resolve(response)

            }

        })
    },


    showallUser: () => {
        return new Promise(async (resolve, reject) => {
            let userdata = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(userdata)
        })
    },

    fetchUserDetails: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((userData) => {
                resolve(userData)
            })
        })

    },

    fetchActiveUser: () => {
        return new Promise(async (resolve, reject) => {
            let userdata = await db.get().collection(collection.USER_COLLECTION).find({ Status: true }).toArray()
            resolve(userdata)
        })
    },

    fetchBlockedUser: () => {
        return new Promise(async (resolve, reject) => {
            let userdata = await db.get().collection(collection.USER_COLLECTION).find({ Status: false }).toArray()
            resolve(userdata)
        })
    },


    checkNum: (data) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION)
                .findOne({ $and: [{ countryCode: data.countryCode }, { Pnum: data.Pnum }] })

            if (user) {

                resolve(user)

            } else {

                resolve(false)
            }
        })

    },


    fetchOtpuser: (Mob) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Pnum: Mob })
            resolve(user)
        })
    },


    addTocart: (prodId, userId, price, prodName) => {

        let prodObj = {
            item: objectId(prodId),
            Product_Name: prodName,
            quantity: 1,
            price: price,
            total: parseInt(price),
            status: 'Placed'
        }

        return new Promise(async (resolve, reject) => {

            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })

            if (userCart) {

                let ExistProd = userCart.products.findIndex(product => product.item == prodId)

                if (ExistProd != -1) {

                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(prodId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(() => {
                                resolve()
                            })

                } else {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {

                            $push: { products: prodObj }

                        }).then(() => {
                            resolve()
                        })

                }

            } else {

                let cartObj = {
                    user: objectId(userId),
                    products: [prodObj]
                }

                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(() => {
                    resolve()
                })

            }
        })

    },


    fetchCartProd: (userId) => {

        return new Promise(async (resolve, reject) => {

            let cartProds = await db.get().collection(collection.CART_COLLECTION).aggregate([

                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        price: '$products.price',
                        total: '$products.total'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        price: 1,
                        total: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()

            if (cartProds.length != 0) {
                for (key in cartProds) {
                    product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(cartProds[key].item) })
                    await db.get().collection(collection.CART_COLLECTION).updateOne({ products: { $elemMatch: { item: product._id } } }, { $set: { 'products.$.price': product.Price, 'products.$.total': cartProds[key].quantity * product.Price } })
                }
                resolve(cartProds)
            } else {
                resolve(false)
            }

        })
    },


    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },


    changeProdQty: (details) => {

        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        details.price = parseInt(details.price)

        return new Promise((resolve, reject) => {

            if (details.count == -1 && details.quantity == 1) {
                resolve({ removeProd: true })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: {
                                'products.$.quantity': details.count,
                                'products.$.total': details.price * details.count
                            }
                        }
                    ).then(() => {

                        resolve({ status: true })
                    })
            }
        })
    },


    removeItem: (cartId, prodId) => {
        return new Promise(async (resolve, reject) => {

            await db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(cartId) },
                    {
                        $pull: { products: { item: objectId(prodId) } }
                    }).then(() => {

                        resolve()
                    })
        })
    },


    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartTotal = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        total: '$products.total'
                    }
                },
                {
                    $group: {
                        _id: null,
                        ctotal: { $sum: '$total' }
                    }
                }

            ]).toArray()

            if (cartTotal.length != 0) {

                resolve(cartTotal[0].ctotal)

            } else {

                resolve(false)
            }

        })
    },


    placeOrder: (order, products, total, refId) => {
        return new Promise((resolve, reject) => {

            // let payStatus = order.Pay_Method === 'COD' ? 'Completed' : 'Completed'

            let orderObj = {

                Name: order.First_Name + ' ' + order.Last_Name,
                RefId: refId,

                Address: {
                    Company_Name: order.Company_Name,
                    Street_Address: order.Street_Address,
                    Extra_Details: order.Extra_Details,
                    Town_City: order.Town_City,
                    Country_State: order.Country_State,
                    Post_Code: order.Post_Code,
                },

                Phone: {
                    Phone: order.Phone,
                    Alt_Phone: order.Alt_Phone,
                },

                Coupon_Code: order.Coupon_Code,
                Pay_Method: order.Pay_Method,
                UserId: objectId(order.userId),
                Products: products,
                Total_Amount: total,
                // Payment_Stats: payStatus,
                Date: new Date().toISOString().slice(0, 10),
                Time: new Date().toLocaleString('en-US').slice(11, 23),
                Mode: 'cart'

            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((result) => {

                resolve(result.insertedId)
            })

        })
    },

    buyNowPlaceOrder: (order, product, refId) => {
        return new Promise((resolve, reject) => {

            // let payStatus = order.Pay_Method === 'COD' ? 'Completed' : 'Completed'


            let orderObj = {

                Name: order.First_Name + ' ' + order.Last_Name,
                RefId: refId,

                Address: {
                    First_Name: order.First_Name,
                    Last_Name: order.Last_Name,
                    Company_Name: order.Company_Name,
                    Street_Address: order.Street_Address,
                    Extra_Details: order.Extra_Details,
                    Town_City: order.Town_City,
                    Country_State: order.Country_State,
                    Post_Code: order.Post_Code,
                    Phone: order.Phone,
                    Alt_Phone: order.Alt_Phone
                },

                Phone: {
                    Phone: order.Phone,
                    Alt_Phone: order.Alt_Phone
                },

                Coupon_Code: order.Coupon_Code,
                Pay_Method: order.Pay_Method,
                UserId: objectId(order.userId),
                ProdId: product._id,
                Product_Name: product.Product_Name,
                Price: product.Price,
                quantity: 1,
                Total_Amount: parseInt(order.totalfinalPrice),
                // Payment_Stats: payStatus,
                Date: new Date().toISOString().slice(0, 10),
                Time: new Date().toLocaleString('en-US').slice(11, 23),
                Mode: 'buynow',
                Status: 'Placed'

            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((result) => {

                resolve(result.insertedId)
            })

        })
    },




    emptyCart: (userId) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) }).then(() => {

                resolve()

            })
        })
    },

    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },


    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ UserId: objectId(userId) }).toArray()

            resolve(orders)

        })

    },


    getProdsInOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let prodInOrder = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $project: {
                        item: '$Products.item',
                        quantity: '$Products.quantity',
                        price: '$Products.price',
                        total: '$Products.total',
                        status: '$Products.status'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        price: 1,
                        total: 1,
                        status: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(prodInOrder)
        })
    },


    generateRazorpay: (refId, totalPrice) => {
        return new Promise((resolve, reject) => {

            var options = {

                amount: totalPrice * 100,  // amount in the smallest currency unit  
                currency: "INR",
                receipt: "" + refId

            };

            instance.orders.create(options, function (err, order) {

                resolve(order)

            });


        })
    },


    verifyPayment: (details) => {

        return new Promise((resolve, reject) => {

            let hmac = crypto.createHmac('sha256', 'QW2zVUpfyn2rg3lN5kO8knV7');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')

            if (hmac == details['payment[razorpay_signature]']) {

                resolve()

            } else {

                reject()

            }

        })

    },

    generatePaypal: (orderId, totalPrice) => {

        return new Promise(async (resolve, reject) => {
            var create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": 'http://localhost:8000/test',
                    "cancel_url": "http://cancel.url"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": orderId,
                            "sku": "item",
                            "price": totalPrice,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": totalPrice,
                    },
                    "description": "The Payement success"
                }]
            };
            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {

                    reject(false);

                } else {

                    resolve(true)
                }
            });
        })
    },


    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let allOrders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(allOrders)
        })
    },

    fetchAllUserOrders: (userId) => {

        return new Promise(async (resolve, reject) => {

            let userOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ UserId: objectId(userId) }).toArray()

            resolve(userOrders)

        })

    },

    getSpecificOrder: (orderId) => {

        return new Promise(async (resolve, reject) => {

            let order = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) })
            resolve(order)

        })

    },

    changeUserStats: (userId) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((result) => {

                if (result.Status) {

                    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                        {
                            $set: {
                                Status: false
                            }
                        }).then(() => { resolve() })

                } else {

                    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                        {
                            $set: {
                                Status: true
                            }
                        }).then(() => { resolve() })

                }
            })

        })
    },

    changeOrderStats: (orderId, prodId, statusUpdate, quantity) => {

        return new Promise(async (resolve, reject) => {

            quantity = parseInt(quantity)

            // if (statusUpdate == 'Delivered') {

            //     var delOrderCount=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            //         {
            //             $match:{_id:objectId(orderId)}
            //         },
            //         {
            //             $unwind:'$Products'
            //         },
            //         {
            //             $match:{
            //                 'Products.status':'Delivered'
            //             }
            //         }
            //     ]).toArray()

            //     console.log(delOrderCount)

            //     // await db.get().collection(collection.ORDER_COLLECTION)
            //     //     .updateOne({ _id: objectId(orderId) },
            //     //         {
            //     //             $set: {
            //     //                 Payment_Stats: 'Completed'
            //     //             }
            //     //         })

            // }


            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId), Products: { $elemMatch: { item: objectId(prodId) } } },
                    {
                        $set: {
                            "Products.$.status": statusUpdate
                        }

                    }).then(() => {

                        if (statusUpdate == 'Cancelled') {

                            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) },
                                {
                                    $inc: { Stock: quantity }
                                }).then(() => {
                                    resolve()
                                })

                        } else {

                            resolve()

                        }

                    })

        })

    },


    changebuyNowOrderStat: (orderId, statusUpdate, prodId) => {


        return new Promise(async (resolve, reject) => {
            // if (statusUpdate == 'Delivered') {
            //     await db.get().collection(collection.ORDER_COLLECTION)
            //         .updateOne({ _id: objectId(orderId) },
            //             {
            //                 $set: {
            //                     Payment_Stats: 'Completed'
            //                 }
            //             })
            // }

            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {

                            Status: statusUpdate

                        }

                    }).then(() => {

                        if (statusUpdate == 'Cancelled') {

                            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) },
                                {

                                    $inc: { Stock: 1 }

                                }).then(() => {

                                    resolve()

                                })

                        } else {

                            resolve()

                        }

                    })

        })

    },

    addNewAddress: (address, userId) => {

        let addressData = {
            addressId: uuidv4(),
            First_Name: address.First_Name,
            Last_Name: address.Last_Name,
            Company_Name: address.Company_Name,
            Street_Address: address.Street_Address,
            Extra_Details: address.Extra_Details,
            Town_City: address.Town_City,
            Country_State: address.Country_State,
            Post_Code: address.Post_Code,
            Phone: address.Phone,
            Alt_Phone: address.Alt_Phone
        }

        return new Promise(async (resolve, reject) => {



            let getAddress = await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ user: objectId(userId) })



            if (getAddress) {

                db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ user: objectId(userId) },
                    {
                        $push: {
                            Address: addressData
                        }
                    }).then((response) => {
                        resolve(response)
                    })

            } else {

                let addressObj = {

                    user: objectId(userId),
                    Address: [addressData]
                }

                db.get().collection(collection.ADDRESS_COLLECTION).insertOne(addressObj).then((response) => {
                    resolve(response)
                })

            }



        })
    },


    fetchUserAddress: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).findOne({ user: objectId(userId) }).then((address) => {
                
                if(address){
                    let addArray = address.Address

                    if (addArray.length > 0) {
                        resolve(address)
                    } else {
                        resolve(false)
                    }
                }else{
                    resolve(false)
                }
               
            })
        })
    },

    deleteAddress: (userId, addId) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ user: objectId(userId) },

                {
                    $pull: {
                        Address: { addressId: addId }
                    }

                },
                {
                    multi: true
                }).then(() => {

                    resolve()
                })
        })

    },

    fetchAddressToEdit: (userId, addId) => {

        return new Promise(async (resolve, reject) => {

            let addresssData = await db.get().collection(collection.ADDRESS_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: "$Address"
                },
                {
                    $match: { "Address.addressId": addId }
                }
            ]).toArray()

            resolve(addresssData[0].Address)


        })
    },

    editAddress: (userId, addressData, addId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ user: objectId(userId), Address: { $elemMatch: { addressId: addId } } },
                {
                    $set: {
                        'Address.$.First_Name': addressData.First_Name,
                        'Address.$.Last_Name': addressData.Last_Name,
                        'Address.$.Company_Name': addressData.Company_Name,
                        'Address.$.Street_Address': addressData.Street_Address,
                        'Address.$.Extra_Details': addressData.Extra_Details,
                        'Address.$.Town_City': addressData.Town_City,
                        'Address.$.Country_State': addressData.Country_State,
                        'Address.$.Post_Code': addressData.Post_Code,
                        'Address.$.Phone': addressData.Phone,
                        'Address.$.Alt_Phone': addressData.Alt_Phone
                    }
                }).then(() => {
                    resolve()
                })
        })
    },

    updateUserProfile: (userId, profileData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $set: {
                        Username: profileData.Username,
                        Email: profileData.Email,
                        Pnum: profileData.Pnum
                    }

                }).then(() => {
                    resolve(userId)
                })
        })
    },

    fetchCoupons: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((coupons) => {
                resolve(coupons)
            })
        })
    },

    addnewCoupon: (newCoupon) => {
       
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).insertOne({
                Coupon_Code: newCoupon.Coupon_Code,
                Coupon_Percentage: newCoupon.Coupon_Percentage,
                expiryDate: new Date(newCoupon.expiryDate).getTime(),
                expiryDateToDisplay: new Date(newCoupon.expiryDate).toLocaleString('en-US').slice(0, 10)
            }).then(() => {
                resolve()
            })
        })
    },

    deleteCoupon: (couponId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({ _id: objectId(couponId) }).then(() => {
                resolve()
            })
        })
    },

    checkcouponExpiry:()=>{

        return new Promise((resolve, reject) => {

            let date = new Date().getTime()

            db.get().collection(collection.COUPON_COLLECTION).find({ expiryDate: { $lte: date } }).toArray().then((coupons) => {
                resolve(coupons)
            })

        })
    },

    checkCouponCode: (couponCode, price, userId) => {


        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).findOne({ Coupon_Code: couponCode }).then((coupon) => {

                if (coupon) {

                    db.get().collection(collection.ORDER_COLLECTION).findOne({ UserId: objectId(userId), Coupon_Code: couponCode }).then((Couponstat) => {

                        if (Couponstat) {

                            let Usedcoupon = {}
                            Usedcoupon.usedCoupon = true
                            resolve(Usedcoupon)

                        } else {
                            let couponSuccess = {}
                            couponSuccess.discountPrice = (price * coupon.Coupon_Percentage) / 100
                            couponSuccess.finalPrice = price - ((price * coupon.Coupon_Percentage) / 100)
                            resolve(couponSuccess)

                        }
                    })

                } else {

                    let invalidCoupon = {}
                    invalidCoupon.InvalidCoupon = true
                    resolve(invalidCoupon)


                }
            })
        })
    },

    fetchWishlist: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })

            if (wishlist) {
                resolve(wishlist.products)
            } else {
                resolve(false)
            }

        })
    },

    addToWishlist: (userId, prodId) => {
        return new Promise(async (resolve, reject) => {

            var itemExist = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $match: { 'products.item': objectId(prodId) }
                }

            ]).toArray()

            if (itemExist.length > 0) {

                resolve(false)

            } else {

                let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) })

                let wishObj = {
                    item: objectId(prodId),
                    prodName: product.Product_Name,
                    prodPrice: product.Price,
                    prodStock: product.Stock

                }

                var wishList = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })

                if (wishList) {

                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) }, {
                        $push: {
                            products: wishObj
                        }
                    }).then((response) => {
                        resolve(response)
                    })


                } else {
                    let newWish = {
                        user: objectId(userId),
                        products: [wishObj]
                    }

                    db.get().collection(collection.WISHLIST_COLLECTION).insertOne(newWish).then((response) => {
                        resolve(response)
                    })

                }

            }


        })
    },


    removeFromWishlist: (userId, prodId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) }, {
                $pull: {
                    products: { item: objectId(prodId) }
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },


    //admin-dashboard helpers start

    totalUsersCount: () => {
        return new Promise(async (resolve, reject) => {

            let allUsers = await db.get().collection(collection.USER_COLLECTION).count()
            let blockedUsers = await db.get().collection(collection.USER_COLLECTION).count({ Status: false })
            let activeUsers = await db.get().collection(collection.USER_COLLECTION).count({ Status: true })

            let userCounts = {
                allUsers: allUsers,
                blockedUsers: blockedUsers,
                activeUsers: activeUsers
            }

            resolve(userCounts)

        })
    },

    orderCount: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).count().then((count) => {
                resolve(count)
            })
        })
    },


    totalRevenue: () => {
        return new Promise(async (resolve, reject) => {

            let buyNowRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        Mode: 'buynow',
                        Status: 'Delivered'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$Total_Amount' }

                    }
                }
            ]).toArray()

            if (buyNowRevenue[0]) {
                buyNowRevenue = buyNowRevenue[0].total
            } else {
                buyNowRevenue = 0
            }

            let cartRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $match: { 'Products.status': 'Delivered' }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$Products.total' }

                    }
                }

            ]).toArray()

            if (cartRevenue[0]) {
                cartRevenue = cartRevenue[0].total
            } else {
                cartRevenue = 0
            }

            let totalRevenue = buyNowRevenue + cartRevenue

            resolve(totalRevenue)

        })
    },

    orderPaymentMethod: () => {
        return new Promise(async (resolve, reject) => {
            let COD = await db.get().collection(collection.ORDER_COLLECTION).count({ Pay_Method: 'COD' })
            let RazorPay = await db.get().collection(collection.ORDER_COLLECTION).count({ Pay_Method: 'Razorpay' })
            let PayPal = await db.get().collection(collection.ORDER_COLLECTION).count({ Pay_Method: 'PayPal' })

            let Pay_Method = {
                COD: COD,
                RazorPay: RazorPay,
                PayPal: PayPal
            }

            resolve(Pay_Method)
        })
    },

    totalProdCount: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).count().then((totalProdCount) => {
                resolve(totalProdCount)
            })
        })
    },

    ProdsStockCount: () => {
        return new Promise(async (resolve, reject) => {
            let lowStockProdCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ $and: [{ Stock: { $lte: 5 } }, { Stock: { $gte: 1 } }] }).toArray()
            lowStockProdCount = lowStockProdCount.length

            let outOfStockProdCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Stock: 0 }).toArray()
            outOfStockProdCount = outOfStockProdCount.length

            let inStockProdCount = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Stock: { $gt: 5 } }).toArray()
            inStockProdCount = inStockProdCount.length

            let ProdsStockCount = {
                lowStockProdCount: lowStockProdCount,
                outOfStockProdCount: outOfStockProdCount,
                inStockProdCount: inStockProdCount
            }

            resolve(ProdsStockCount)
        })
    },

    orderCounts: () => {
        return new Promise(async (resolve, reject) => {

            let buyNowOrderCount = await db.get().collection(collection.ORDER_COLLECTION).count({ Mode: 'buynow' })
            let cartOrderCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $project: {
                        Products: 1
                    }
                }

            ]).toArray()

            cartOrderCount = cartOrderCount.length

            let AllOrderCount = buyNowOrderCount + cartOrderCount




            let buynowPlacedOrderCount = await db.get().collection(collection.ORDER_COLLECTION).count({ Mode: 'buynow', Status: 'Placed' })
            let cartPlacedOrderCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $match: { 'Products.status': 'Placed' }
                }
            ]).toArray()

            cartPlacedOrderCount = cartPlacedOrderCount.length

            let totalPlacedOrderCount = buynowPlacedOrderCount + cartPlacedOrderCount




            let buynowShippedOrderCount = await db.get().collection(collection.ORDER_COLLECTION).count({ Mode: 'buynow', Status: 'Shipped' })
            let cartShippedOrderCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $match: { 'Products.status': 'Shipped' }
                }
            ]).toArray()

            cartShippedOrderCount = cartShippedOrderCount.length

            let totalShippedOrderCount = buynowShippedOrderCount + cartShippedOrderCount




            let buynowDeliveredOrderCount = await db.get().collection(collection.ORDER_COLLECTION).count({ Mode: 'buynow', Status: 'Delivered' })
            let cartDeliveredOrderCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $match: { 'Products.status': 'Delivered' }
                }
            ]).toArray()

            cartDeliveredOrderCount = cartDeliveredOrderCount.length

            let totalDeliveredOrderCount = buynowDeliveredOrderCount + cartDeliveredOrderCount




            let buynowCancelledOrderCount = await db.get().collection(collection.ORDER_COLLECTION).count({ Mode: 'buynow', Status: 'Cancelled' })
            let cartCancelledOrderCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $match: { 'Products.status': 'Cancelled' }
                }
            ]).toArray()

            cartCancelledOrderCount = cartCancelledOrderCount.length

            let totalCancelledOrderCount = buynowCancelledOrderCount + cartCancelledOrderCount


            let Counts = {
                AllOrderCount: AllOrderCount,
                totalPlacedOrderCount: totalPlacedOrderCount,
                totalShippedOrderCount: totalShippedOrderCount,
                totalDeliveredOrderCount: totalDeliveredOrderCount,
                totalCancelledOrderCount: totalCancelledOrderCount
            }

            resolve(Counts)

        })
    },

    prodsInOrderCounts: () => {
        return new Promise(async (resolve, reject) => {

            let totalBuyNowProdCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        Mode: 'buynow'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$quantity' }

                    }
                }
            ]).toArray()

            if (totalBuyNowProdCount[0]) {
                totalBuyNowProdCount = totalBuyNowProdCount[0].total
            } else {
                totalBuyNowProdCount = 0
            }

            let totalCartProdCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$Products.quantity' }

                    }
                }

            ]).toArray()

            if (totalCartProdCount[0]) {
                totalCartProdCount = totalCartProdCount[0].total
            } else {
                totalCartProdCount = 0
            }

            let totalProdCount = totalBuyNowProdCount + totalCartProdCount




            let totalBuyNowPlacedProdCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        Mode: 'buynow',
                        Status: 'Placed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$quantity' }

                    }
                }
            ]).toArray()

            if (totalBuyNowPlacedProdCount[0]) {
                totalBuyNowPlacedProdCount = totalBuyNowPlacedProdCount[0].total
            } else {
                totalBuyNowPlacedProdCount = 0
            }

            let totalCartPlacedProdCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $match: { 'Products.status': 'Placed' }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$Products.quantity' }

                    }
                }

            ]).toArray()

            if (totalCartPlacedProdCount[0]) {
                totalCartPlacedProdCount = totalCartPlacedProdCount[0].total
            } else {
                totalCartPlacedProdCount = 0
            }

            let totalPlacedProdCount = totalBuyNowPlacedProdCount + totalCartPlacedProdCount




            let totalBuyNowShippedProdCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        Mode: 'buynow',
                        Status: 'Shipped'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$quantity' }

                    }
                }
            ]).toArray()

            if (totalBuyNowShippedProdCount[0]) {
                totalBuyNowShippedProdCount = totalBuyNowShippedProdCount[0].total
            } else {
                totalBuyNowShippedProdCount = 0
            }

            let totalCartShippedProdCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $match: { 'Products.status': 'Shipped' }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$Products.quantity' }

                    }
                }

            ]).toArray()

            if (totalCartShippedProdCount[0]) {
                totalCartShippedProdCount = totalCartShippedProdCount[0].total
            } else {
                totalCartShippedProdCount = 0
            }

            let totalShippedProdCount = totalBuyNowShippedProdCount + totalCartShippedProdCount




            let totalBuyNowDeliveredProdCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        Mode: 'buynow',
                        Status: 'Delivered'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$quantity' }

                    }
                }
            ]).toArray()

            if (totalBuyNowDeliveredProdCount[0]) {
                totalBuyNowDeliveredProdCount = totalBuyNowDeliveredProdCount[0].total
            } else {
                totalBuyNowDeliveredProdCount = 0
            }

            let totalCartDeliveredProdCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $match: { 'Products.status': 'Delivered' }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$Products.quantity' }

                    }
                }

            ]).toArray()

            if (totalCartDeliveredProdCount[0]) {
                totalCartDeliveredProdCount = totalCartDeliveredProdCount[0].total
            } else {
                totalCartDeliveredProdCount = 0
            }

            let totalDeliveredProdCount = totalBuyNowDeliveredProdCount + totalCartDeliveredProdCount




            let totalBuyNowCancelledProdCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        Mode: 'buynow',
                        Status: 'Cancelled'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$quantity' }

                    }
                }
            ]).toArray()

            if (totalBuyNowCancelledProdCount[0]) {
                totalBuyNowCancelledProdCount = totalBuyNowCancelledProdCount[0].total
            } else {
                totalBuyNowCancelledProdCount = 0
            }

            let totalCartCancelledProdCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $match: { 'Products.status': 'Cancelled' }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$Products.quantity' }

                    }
                }

            ]).toArray()

            if (totalCartCancelledProdCount[0]) {
                totalCartCancelledProdCount = totalCartCancelledProdCount[0].total
            } else {
                totalCartCancelledProdCount = 0
            }

            let totalCancelledProdCount = totalBuyNowCancelledProdCount + totalCartCancelledProdCount




            let prodsInOrderCounts = {

                totalProdCount: totalProdCount,
                totalPlacedProdCount: totalPlacedProdCount,
                totalShippedProdCount: totalShippedProdCount,
                totalDeliveredProdCount: totalDeliveredProdCount,
                totalCancelledProdCount: totalCancelledProdCount

            }

            resolve(prodsInOrderCounts)

        })
    },

    //admin-dashboard helpers ends


    convertAmount: (amount) => {
        return new Promise(async (resolve, reject) => {
            amount = parseInt(amount)
            axios.get(`http://apilayer.net/api/live?access_key=${ACCESS_KEY}&currencies=INR`).then(response => {
                amount = amount / response.data.quotes.USDINR
                resolve(amount)
            })
        })
    },

    //category-offer helpers starts

    fetchCatOffers: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_OFFER_COLLECTION).find().toArray().then((offers) => {
                resolve(offers)
            })
        })
    },

    checkCatOfferExist: (subCat) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.CATEGORY_OFFER_COLLECTION).findOne({ subCategory: subCat }).then((offers) => {

                resolve(offers)

            })

        })
    },

    checkCatOfferExpiry: () => {

        return new Promise((resolve, reject) => {

            let date = new Date().getTime()

            db.get().collection(collection.CATEGORY_OFFER_COLLECTION).find({ expiryDate: { $lte: date } }).toArray().then((offers) => {
                resolve(offers)
            })

        })

    },

    addNewCatOffer: (offerData) => {
        return new Promise((resolve, reject) => {

            offerData.offerDiscount = parseInt(offerData.offerDiscount)

            db.get().collection(collection.CATEGORY_OFFER_COLLECTION).insertOne({

                offerName: offerData.offerName,
                subCategory: offerData.subCategory,
                addedDate: new Date().toLocaleString('en-US').slice(0, 10),
                expiryDate: new Date(offerData.expiryDate).getTime(),
                expiryDateToDisplay: new Date(offerData.expiryDate).toLocaleString('en-US').slice(0, 10),
                offerDiscount: offerData.offerDiscount

            }).then(() => {

                db.get().collection(collection.PRODUCT_COLLECTION).updateMany(

                    { Sub_Category: offerData.subCategory, offer: { $exists: false } },

                    {
                        $set: {
                            offer: offerData.offerDiscount,
                            offerName: offerData.offerName,
                            offerType: 'category'
                        }
                    }

                ).then(() => {

                    db.get().collection(collection.PRODUCT_COLLECTION).find({ Sub_Category: offerData.subCategory, offerType: 'category' }).toArray().then((products) => {
                        resolve(products)
                    })

                })

            })


        })
    },

    changeOfferProdPrice: (singleProd) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                { _id: objectId(singleProd._id) },
                {
                    $set: {
                        tempPrice: singleProd.Price,
                        Price: singleProd.Price - (singleProd.Price * singleProd.offer / 100)
                    }
                }
            ).then(() => {

                resolve()

            })

        })

    },

    fetchAllProdInSubCatToUpdate: (subCat) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.PRODUCT_COLLECTION).find({ Sub_Category: subCat, offerType: 'category' }).toArray().then((products) => {

                resolve(products)

            })


        })

    },

    updateEachProdBackToOrgPrice: (SingleProd) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                { _id: objectId(SingleProd._id) },
                {
                    $set: { Price: SingleProd.tempPrice }
                }
            ).then(() => {

                db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                    { _id: objectId(SingleProd._id) },
                    {
                        $unset: { tempPrice: "", offer: "", offerName: "", offerType: "" }
                    }
                ).then(() => {

                    resolve()

                })

            })

        })
    },

    deleteCatOffer: (offerId) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.CATEGORY_OFFER_COLLECTION).deleteOne({ _id: objectId(offerId) }).then(() => {
                resolve()
            })

        })

    },

    //category-offer helpers ends


    //product-offer helpers starts

    fetchProdOffers: () => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.PRODUCT_OFFER_COLLECTION).find().toArray().then((offers) => {

                resolve(offers)

            })

        })

    },

    checkProdOfferExist: (prodId) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then((product) => {

                if ('offer' in product) {

                    resolve(true)

                } else {

                    resolve(false)

                }

            })

        })

    },

    addNewprodOffer: (offerData) => {

        return new Promise(async (resolve, reject) => {

            var prod = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(offerData.product) })

            offerData.offerDiscount = parseInt(offerData.offerDiscount)

            db.get().collection(collection.PRODUCT_OFFER_COLLECTION).insertOne({

                offerName: offerData.offerName,
                prodId: offerData.product,
                product: prod.Product_Name,
                addedDate: new Date().toLocaleString('en-US').slice(0, 10),
                expiryDate: new Date(offerData.expiryDate).getTime(),
                expiryDateToDisplay: new Date(offerData.expiryDate).toLocaleString('en-US').slice(0, 10),
                offerDiscount: offerData.offerDiscount

            }).then(() => {

                db.get().collection(collection.PRODUCT_COLLECTION).updateOne(

                    { _id: objectId(offerData.product) },

                    {
                        $set: {
                            offer: offerData.offerDiscount,
                            offerName: offerData.offerName,
                            offerType: 'product',
                            tempPrice: prod.Price,
                            Price: prod.Price - (prod.Price * offerData.offerDiscount / 100)
                        }
                    }

                ).then(() => {

                    resolve()

                })

            })

        })

    },

    deleteprodOffer: (offerId) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.PRODUCT_OFFER_COLLECTION).deleteOne({ _id: objectId(offerId) }).then(() => {
                resolve()
            })

        })

    },

    checkProdOfferExpiry: () => {
        return new Promise((resolve, reject) => {

            let date = new Date().getTime()

            db.get().collection(collection.PRODUCT_OFFER_COLLECTION).find({ expiryDate: { $lte: date } }).toArray().then((offers) => {
                resolve(offers)
            })

        })
    },


    //product-offer helpers ends


    //review helpers start

    fetchReviews: (prodId) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.REVIEW_COLLECTION).findOne({ prodId: objectId(prodId) }).then((review) => {

                resolve(review)

            })

        })

    },

    checkUserPurchasedItem: (userId, prodId) => {

        return new Promise(async (resolve, reject) => {

            let buyNowPurchaseCheck = await db.get().collection(collection.ORDER_COLLECTION).count({ UserId: objectId(userId), Mode: 'buynow', ProdId: prodId, Status: 'Delivered' })



            let cartPurchaseCheck = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        UserId: objectId(userId),
                        Mode: 'cart'
                    }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $match: {
                        'Products.item': objectId(prodId),
                        'Products.status': 'Delivered'
                    }
                }
            ]).toArray()

            if (buyNowPurchaseCheck != 0 || cartPurchaseCheck.length != 0) {

                resolve(true)

            } else {

                resolve(false)

            }


        })

    },

    addReview: (reviewData) => {

        let reviewObj = {

            userId: objectId(reviewData.userId),
            userName: reviewData.userName,
            rating: parseInt(reviewData.rating),
            review: reviewData.review,
            postedDate: new Date().toLocaleString('en-US').slice(0, 10)

        }

        return new Promise(async (resolve, reject) => {

            let reviewCheck = await db.get().collection(collection.REVIEW_COLLECTION).findOne({ prodId: objectId(reviewData.prodId) })

            if (reviewCheck) {

                db.get().collection(collection.REVIEW_COLLECTION).updateOne(
                    { prodId: objectId(reviewData.prodId) },
                    {
                        $push: { prodReview: reviewObj }

                    }).then(() => {

                        resolve()
                    })

            } else {

                let prodReviewObj = {

                    prodId: objectId(reviewData.prodId),
                    prodName: reviewData.prodName,
                    prodReview: [reviewObj]

                }

                db.get().collection(collection.REVIEW_COLLECTION).insertOne(prodReviewObj).then(() => {
                    resolve()
                })

            }

        })

    },

    checkUserCmmnts: (prodId, userId) => {

        return new Promise(async (resolve, reject) => {



            let userCmmnt = await db.get().collection(collection.REVIEW_COLLECTION).aggregate([
                {
                    $match: { prodId: objectId(prodId) }
                },
                {
                    $unwind: '$prodReview'
                },
                {
                    $match: { 'prodReview.userId': objectId(userId) }
                }
            ]).toArray()

            if (userCmmnt.length > 0) {

                resolve(userCmmnt[0].prodReview)

            } else {

                resolve(false)

            }
        })

    },

    deleteReview: (prodId, userId) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.REVIEW_COLLECTION).updateOne({ prodId: objectId(prodId) }, { $pull: { prodReview: { userId: objectId(userId) } } }).then(() => {
                resolve()
            })

        })

    },

    editReview: (editedReviewData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.REVIEW_COLLECTION).updateOne({ prodId: objectId(editedReviewData.prodId), prodReview: { $elemMatch: { userId: objectId(editedReviewData.userId) } } },
                {
                    $set: {
                        'prodReview.$.rating': editedReviewData.rating,
                        'prodReview.$.review': editedReviewData.review,
                        'prodReview.$.postedDate': new Date().toLocaleString('en-US').slice(0, 10)
                    }
                }).then(() => {
                    resolve()
                })
        })
    },

    //review helpers start

    fetchSearchMatchProds: (searchData) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.PRODUCT_COLLECTION).find({ Product_Name: { $regex: searchData.keyword, $options: "$i" } }).toArray().then((products) => {

                resolve(products)

            })

        })

    },

    fetchAllPlacedOrders: () => {

        return new Promise(async (resolve, reject) => {

            let buyNowPlaced = await db.get().collection(collection.ORDER_COLLECTION).find({ Mode: 'buynow', Status: 'Placed' }).toArray()

            let cartPlaced = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $match: { 'Products.status': 'Placed' }
                }
            ]).toArray()

            let allPlacedOrders = await buyNowPlaced.concat(cartPlaced)
            resolve(allPlacedOrders)

        })

    },

    fetchAllShippedOrders: () => {

        return new Promise(async (resolve, reject) => {

            let buyNowShipped = await db.get().collection(collection.ORDER_COLLECTION).find({ Mode: 'buynow', Status: 'Shipped' }).toArray()

            let cartShipped = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $match: { 'Products.status': 'Shipped' }
                }
            ]).toArray()

            let allShippedOrders = await buyNowShipped.concat(cartShipped)
            resolve(allShippedOrders)

        })

    },

    fetchAllDeliveredOrders: () => {

        return new Promise(async (resolve, reject) => {

            let buyNowDelivered = await db.get().collection(collection.ORDER_COLLECTION).find({ Mode: 'buynow', Status: 'Delivered' }).toArray()

            let cartDelivered = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $match: { 'Products.status': 'Delivered' }
                }
            ]).toArray()

            let allDeliveredOrders = await buyNowDelivered.concat(cartDelivered)
            resolve(allDeliveredOrders)

        })

    },

    fetchAllCancelledOrders: () => {

        return new Promise(async (resolve, reject) => {

            let buyNowCancelled = await db.get().collection(collection.ORDER_COLLECTION).find({ Mode: 'buynow', Status: 'Cancelled' }).toArray()

            let cartCancelled = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                },
                {
                    $match: { 'Products.status': 'Cancelled' }
                }
            ]).toArray()

            let allCancelledOrders = await buyNowCancelled.concat(cartCancelled)
            resolve(allCancelledOrders)

        })

    },

    fetchTotalOrders: () => {

        return new Promise(async (resolve, reject) => {

            let buyNowAllOrders = await db.get().collection(collection.ORDER_COLLECTION).find({ Mode: 'buynow' }).toArray()

            let cartAllOrders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { Mode: 'cart' }
                },
                {
                    $unwind: '$Products'
                }
            ]).toArray()

            let allOrders = await buyNowAllOrders.concat(cartAllOrders)
            resolve(allOrders)

        })

    },

    fetchOfferDetails: (offerName) => {

        return new Promise(async (resolve, reject) => {

            var result = await db.get().collection(collection.PRODUCT_OFFER_COLLECTION).findOne({ offerName: offerName })

            if (result) {

                resolve(true)

            } else {

                resolve(false)

            }

        })

    },

    fetchProdOfferData: (offerName) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_OFFER_COLLECTION).findOne({ offerName: offerName }).then((offerDetails) => {
                resolve(offerDetails.prodId)
            })
        })

    }


}




