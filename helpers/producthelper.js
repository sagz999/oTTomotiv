var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId
const { v4: uuidv4 } = require('uuid');

module.exports = {
    addProduct: (newProduct) => {
        return new Promise(async (resolve, reject) => {

            newProduct.Stock = parseInt(newProduct.Stock)
            newProduct.Price = parseInt(newProduct.Price)
            newProduct.Date=new Date().toLocaleString('en-US').slice(0, 9),
            newProduct.Time= new Date().toLocaleString('en-US').slice(11, 21),
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
                        Stock: parseInt(prodData.Stock)
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

        let catObj={
            subCatId:uuidv4(),
            Sub_Cat:catData.Sub_Cat

        }

        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(catData.mainCat_Id) },
                {
                    $push: { Sub_Cat: catObj }

                }).then(() => {
                    resolve(catObj.subCatId)
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

    deleteSubCategory: (catId, subCatId) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(catId) },

                {
                    $pull: {
                        Sub_Cat:{subCatId: subCatId}
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

        let newCarModel = {
            modelId: uuidv4(),
            Model_Name: carData.Car_Model
        }


        return new Promise((resolve, reject) => {

            db.get().collection(collection.CAR_BRAND_COLLECTION).updateOne({ _id: objectId(carData.carBrand_Id) },
                {
                    $push: { Car_Model: newCarModel }
                    

                }).then(() => {
                    resolve(newCarModel.modelId)
                })

        })

    },

    deleteCarModel: (brandId, modelId) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collection.CAR_BRAND_COLLECTION).updateOne({ _id: objectId(brandId) },

                {
                    $pull: {
                        Car_Model: {modelId:modelId}
                    }


                }).then(() => {
                    resolve()
                })
        })
    },

    buyNowStockUpdate: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) }, { $inc: { Stock: -1 } }).then(() => {
                resolve()
            })
        })
    },

    cartStockUpdate: (product) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(product.item) },
                {
                    $inc: { Stock: -product.quantity }
                }).then(() => {
                    resolve()
                })

        })
    },

    fetchCategories: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().then((result) => {
                resolve(result)
            })
        })
    },

    fetchCarBrands: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CAR_BRAND_COLLECTION).find().toArray().then((result) => {
                resolve(result)
            })
        })
    },

    fetchProdBrands: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PROD_BRAND_COLLECTION).find().toArray().then((result) => {
                resolve(result)
            })
        })
    },

    fetchCarModel:(brandId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CAR_BRAND_COLLECTION).findOne({_id:objectId(brandId)}).then((carBrand)=>{
                resolve(carBrand)
            })
        })
    },

    fetchSubCatList:(catId)=>{
        return new Promise(async(resolve,reject)=>{

            let subCat= await db.get().collection(collection.CATEGORY_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(catId)}
                },
                {
                    $unwind:"$Sub_Cat"
                },
                {
                    $project:{
                        Sub_Cat:'$Sub_Cat.Sub_Cat'
                    }
                }
            ]).toArray()

            resolve(subCat)

        })
    }


}