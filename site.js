/* Image loader: tries .jpg/.jpeg/.png/.webp/.svg for each <img data-img="path/without-extension">.
   If no file exists yet, the image is removed so nothing broken shows. */
(function () {
  var exts = ["jpg", "jpeg", "png", "webp", "svg"];
  document.querySelectorAll("img[data-img]").forEach(function (img) {
    var base = img.getAttribute("data-img");
    var i = 0;
    img.addEventListener("error", function () {
      i += 1;
      if (i < exts.length) { img.src = base + "." + exts[i]; } else { img.remove(); }
    });
    img.src = base + "." + exts[0];
  });
})();
