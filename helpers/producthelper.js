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

    addMainCategory: (newCat) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(newCat).then((data) => {
                resolve(data)
            })
        })

    },


    fetchCategories: () => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.CATEGORY_COLLECTION).find({ Main_Cat: { $exists: true } }).toArray().then((Categories) => {
                resolve(Categories)
            })

        })
    },

    addSubCategory: (catData) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(catData.mainCat_Id) },
                {
                    $push: { Sub_Cat: catData.Sub_Cat }

                }).then(() => {
                    resolve()
                })

        })

    },


    deleteCategory: (Id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(Id) }).then(() => {
                resolve()
            })
        })
    },

    deleteSubCategory: (Id, Name) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(Id) },

                {
                    $pull: {
                        Sub_Cat: Name
                    }

                }).then(() => {
                    resolve()
                })
        })
    },

    addProdBrand: (newProdBrand) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.PROD_BRAND_COLLECTION).insertOne(newProdBrand).then((data) => {
                resolve(data.insertedId)
            })

        })
    },
    fetchProdBrands: () => {
        return new Promise(async (resolve, reject) => {
            let prodBrands = await db.get().collection(collection.PROD_BRAND_COLLECTION).find().toArray()
            resolve(prodBrands)
        })
    },

    deleteProdBrand: (Id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PROD_BRAND_COLLECTION).deleteOne({ _id: objectId(Id) }).then(() => {
                resolve()
            })
        })
    },

    addCarBrand: (newCarBrand) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.CAR_BRAND_COLLECTION).insertOne(newCarBrand).then((data) => {
                resolve(data.insertedId)
            })

        })
    },

    fetchCarBrands: () => {

        return new Promise(async (resolve, reject) => {

            let carBrands = await db.get().collection(collection.CAR_BRAND_COLLECTION).find().toArray()
            resolve(carBrands)

        })

    },
    deleteCarBrand: (Id) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.CAR_BRAND_COLLECTION).deleteOne({ _id: objectId(Id) }).then(() => {
                resolve()
            })
        })

    },

    addCarModel: (carData) => {

        return new Promise((resolve, reject) => {

            db.get().collection(collection.CAR_BRAND_COLLECTION).updateOne({ _id: objectId(carData.carBrand_Id) },
                {
                    $push: { Car_Model: carData.Car_Model }

                }).then(() => {
                    resolve()
                })

        })

    },

    deleteCarModel: (Id,Name) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collection.CAR_BRAND_COLLECTION).updateOne({ _id: objectId(Id) },

                {
                    $pull: {
                        Car_Model: Name
                    }

                }).then(() => {
                    resolve()
                })
        })
    }


}