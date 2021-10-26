var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId

module.exports = {
    addProduct: (newProduct) => {
        return new Promise(async (resolve, reject) => {

            newProduct.Price = parseInt(newProduct.Price)
            newProduct.Date = new Date()
            await db.get().collection(collection.PRODUCT_COLLECTION).insertOne(newProduct).then((data) => {

                resolve(data.insertedId)
            })
        })

    },

    getRelproducts: (product) => {
        return new Promise(async (resolve, reject) => {
            let relProduct = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Sub_Category: product.Sub_Category }).toArray()
            resolve(relProduct)
        })
    },

    getAllproducts: () => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(product)
        })
    },

    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {
                resolve(response)
            })
        })
    },

    fetchProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then((product) => {
                resolve(product)
            })
        })
    },

    updateProduct: (prodId, prodData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) },
                {
                    $set: {
                        Product_Name: prodData.Product_Name,
                        Main_Category: prodData.Main_Category,
                        Sub_Category: prodData.Sub_Category,
                        Product_Brand: prodData.Product_Brand,
                        Car_Brand: prodData.Car_Brand,
                        Car_Model: prodData.Car_Model,
                        Price: parseInt(prodData.Price),
                        Description: prodData.Description,
                        Date: prodData.Date
                    }
                }).then(() => {
                    resolve()
                })
        })

    },

    addCategory: (newCat) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(newCat).then((data) => {
                resolve(data)
            })
        })

    },

    fetchCategories: () => {
        return new Promise(async (resolve, reject) => {

            let Categories = {}

            let MainCat = await db.get().collection(collection.CATEGORY_COLLECTION).find({ MainCat: { $exists: true } }).toArray()
            let SubCat = await db.get().collection(collection.CATEGORY_COLLECTION).find({ SubCat: { $exists: true } }).toArray()

            Categories.MainCat = MainCat
            Categories.SubCat = SubCat

            resolve(Categories)

        })
    },

    deleteCategory:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(catId)}).then(()=>{
                resolve()
            })
        })
    },

    addCarBrand:(newCarBrand)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BRAND_COLLECTION).insertOne(newCarBrand).then((data) => {
                resolve(data.insertedId)
            })
        })
    }

}