const mongoClient = require('mongodb').MongoClient
const state = {
    db: null
}

module.exports.connect = function(done){
    const url = process.env.mongourl
    const dbname = 'Ottomotiv'

    mongoClient.connect(url, (err, data) => {
        if (err)
            return data(err)
        state.db = data.db(dbname)
        done()
    })

    

}

module.exports.get=function(){
    return state.db
}