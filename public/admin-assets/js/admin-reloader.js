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
    }
}