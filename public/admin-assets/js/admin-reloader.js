window.onload = function() {
    if (sessionStorage.getItem("mainCatDeleted")) {
        sessionStorage.removeItem("mainCatDeleted");
        mainCatDeleteNotification();
    } else if (sessionStorage.getItem("subCatDeleted")) {
        sessionStorage.removeItem("subCatDeleted");
        subCatDeleteNotification();
    } else if (sessionStorage.getItem("prodBrandDeleted")) {
        sessionStorage.removeItem("prodBrandDeleted");
        prodBrandDeleteNotification();
    } else if (sessionStorage.getItem("carBrandDeleted")) {
        sessionStorage.removeItem("carBrandDeleted");
        carBrandDeleteNotification();
    }else if (sessionStorage.getItem("carModelDeleted")) {
        sessionStorage.removeItem("carModelDeleted");
        carModelDeleteNotification();
    }else if (sessionStorage.getItem("adDeleted")) {
        sessionStorage.removeItem("adDeleted");
        adDeleteNotification();
    }else if (sessionStorage.getItem("prodDeleted")) {
        sessionStorage.removeItem("prodDeleted");
        prodDeleteNotification();
    }else if (sessionStorage.getItem("couponDeleted")) {
        sessionStorage.removeItem("couponDeleted");
        couponDeleteNotification();
    }else if (sessionStorage.getItem("offerDeleted")) {
        sessionStorage.removeItem("offerDeleted");
        offerDeleteNotification();
    }
}