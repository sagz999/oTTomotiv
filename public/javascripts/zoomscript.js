// $(document).ready(function () {
//     $(".small-image").hover(function () {
//       $(".zoom-image").attr('src', $(this).attr('src'))
//     })

//   })

  $(document).ready(function () {
    $(".zoom-image").imagezoomsl({
      zoomrange: [1, 1]
    })
  })