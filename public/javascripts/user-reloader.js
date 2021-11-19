window.onload = function () {
   
    if (sessionStorage.getItem("cartreload")){
      sessionStorage.removeItem("cartreload");
      cartNotification();
    }else if (sessionStorage.getItem("addwishlistreload")){
      sessionStorage.removeItem("addwishlistreload");
      addWishNotification();
    }else if (sessionStorage.getItem("removewishlistreload")){
      sessionStorage.removeItem("removewishlistreload");
      removeWishNotification();
    }else if (sessionStorage.getItem("cartProdDelReload")){
      sessionStorage.removeItem("cartProdDelReload");
      delCartProdNotification();
    }
  }