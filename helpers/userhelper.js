var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId

const crypto = require('crypto')

const Razorpay = require('razorpay')

var instance = new Razorpay({
    key_id: 'rzp_test_BR5CAu00Vuru3P',
    key_secret: 'QW2zVUpfyn2rg3lN5kO8knV7',
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

    // fetchUserDetails:(userId)=>{
    //     return new Promise((resolve,reject)=>{
    //         db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((userData)=>{
    //             resolve(userData)
    //         })
    //     })

    // },

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


    addTocart: (prodId, userId, price) => {

        let prodObj = {
            item: objectId(prodId),
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

                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }).then((response) => {

                            resolve({ removeProd: true })
                        })
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

                        resolve({ removeItem: true })
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


    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {

            let payStatus = order.Pay_Method === 'COD' ? 'Completed' : 'Pending'

            let orderObj = {

                Name: order.First_Name + ' ' + order.Last_Name,

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
                Payment_Stats: payStatus,
                Date: new Date().toISOString().slice(0, 10)

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


    generateRazorpay: (orderId, totalPrice) => {
        return new Promise((resolve, reject) => {

            var options = {

                amount: totalPrice * 100,  // amount in the smallest currency unit  
                currency: "INR",
                receipt: "" + orderId

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


    changePaymentStatus: (orderId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            Payment_Stats: 'Completed'
                        }
                    }).then(() => {
                        resolve()
                    })
        })
    },


    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let allOrders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(allOrders)
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

    changeOrderStats: (orderId, prodId, statusUpdate) => {

        return new Promise( (resolve, reject) => {

            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({ _id: objectId(orderId), Products:{$elemMatch:{item:objectId(prodId)}}},
            {
                $set:{
                    "Products.$.status":statusUpdate
                }

            }).then(()=>{

                resolve()

            })

        })

    }

}