var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var exhbs = require('express-handlebars')
var db = require('./config/connection')
var session = require('express-session')
var fileupload = require('express-fileupload')
const handlebars = require('handlebars')
var helper = require('handlebars-helpers')();


var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');

var app = express();

const oneday = 1000 * 60 * 60 * 24;



app.use(session({
  secret: "user",
  saveUninitialized: true,
  cookie: { maxAge: oneday },
  resave: false
}))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
var hbs = exhbs.create({
  extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials/',
  // Custom HBS helpers
  helpers: helper
})
app.engine('hbs', hbs.engine)

app.use(fileupload())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

db.connect((err) => {
  if (err)
    console.log("Connection error" + err)
  else
    console.log("Database connected to PORT 27017")
})

app.use('/', usersRouter);
app.use('/admin', adminRouter);

handlebars.registerHelper("hello", function (context, options, price, prodName) {

  for (key in context) {
    if (options.toString() === context[key].item.toString()) {
      var inp = true
      break;
    } else {
      var inp = false
    }
  }
  if (inp === true) {
    var data = '<a href="/cart"  class="btn btn-primary add-to-cart"> View Cart</a>'
  } else {
    var data = `<a  class="btn btn-primary add-to-cart" onclick="addToCart('${options}','${price}','${prodName}')">Add To Cart</a>`
  }
  return data

})


handlebars.registerHelper("wishlistUpdate", (wishlist, prodId) => {
  var exist

  if (wishlist.length > 0)
    for (key in wishlist) {

      if (wishlist[key].item.toString() == prodId.toString()) {
        exist = true
        break;
      } else {
        exist = false
      }

    }
  var btn
  if (exist == true) {
    btn = `<a class="wishOn" style="width: 20px; border: white; color:red; " onclick=" removeFromWish('${prodId}')"><i class="bi bi-heart-fill"></i></a>`
  } else {
    btn = `<a class="wishOn " style=" width: 20px; border: white " onclick="addToWishList('${prodId}')"><i class="bi bi-heart"></i></a>`
  }
  return btn
})

handlebars.registerHelper('printStar', (starCount) => {
  starCount = starCount
  var star = []
  for (i = 0; i < starCount; i++) {
    star[i] = '<i class="fa fa-star"></i>'
  }
  return star;
})

handlebars.registerHelper('checkArrayLengthPDF',function(array){
  if(array.length >= 1){

    return data = '<button class="btn btn-success btn-sm" onclick="getPdf()">Download <span class="material-icons">picture_as_pdf</span></button>'
    
  }
})

handlebars.registerHelper('checkArrayLengthXLS',function(array){
  if(array.length >= 1){
    return data = '<button style="margin-left:10px" class="btn btn-success btn-sm" onclick="getspreadSheet()">Download <span class="material-icons">description</span></button>'
  }
})


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  console.log('Error message:', err.message)

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
