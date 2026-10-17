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

/* Extracurricular gallery.
   Shows every image in assets/extracurricular/. Description = captions.txt line "filename - description",
   otherwise the file name itself. Works automatically on *.github.io (lists the folder through GitHub's
   public API); on any other host, only files named in captions.txt are shown. */
(function () {
  var root = document.getElementById("gallery");
  if (!root) return;
  var grid = root.querySelector(".gallery-grid");
  var dir = "assets/extracurricular/";
  var imgExt = /\.(jpe?g|png|webp|gif|avif)$/i;
  var exts = ["jpg", "jpeg", "png", "webp", "gif", "avif"];

  function pretty(name) {
    return name.replace(imgExt, "").replace(/^\d+[\s_.\-]+/, "").replace(/_+/g, " ").replace(/\s+/g, " ").trim();
  }
  function parseCaptions(text) {
    var out = [];
    text.split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line || line.charAt(0) === "#") return;
      var m = line.match(/^(.+?)\s+[-\u2013\u2014]\s+(.+)$/);
      out.push(m ? { file: m[1].trim(), desc: m[2].trim() } : { file: line, desc: "" });
    });
    return out;
  }
  function repoPath() {
    var o = root.getAttribute("data-repo");
    if (o) return o;
    var h = location.hostname;
    if (!/\.github\.io$/i.test(h)) return "";
    var owner = h.split(".")[0];
    var seg = location.pathname.split("/").filter(Boolean)[0];
    var repo = seg && !/\.html?$/i.test(seg) ? seg : owner + ".github.io";
    return owner + "/" + repo;
  }
  function getText(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) { return r.ok ? r.text() : ""; }).catch(function () { return ""; });
  }
  function listFolder() {
    var rp = repoPath();
    if (!rp) return Promise.resolve([]);
    return fetch("https://api.github.com/repos/" + rp + "/contents/assets/extracurricular")
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (a) {
        return Array.isArray(a) ? a.filter(function (f) { return f.type === "file" && imgExt.test(f.name); }).map(function (f) { return f.name; }) : [];
      })
      .catch(function () { return []; });
  }
  function build(item) {
    var fig = document.createElement("figure");
    fig.tabIndex = 0;
    var desc = item.desc || pretty(item.file);
    var img = document.createElement("img");
    img.alt = desc; img.loading = "lazy"; img.decoding = "async";
    var hasExt = imgExt.test(item.file), i = 0;
    img.addEventListener("error", function () {
      if (hasExt || i >= exts.length) { fig.remove(); if (!grid.children.length) root.hidden = true; return; }
      img.src = dir + encodeURIComponent(item.file) + "." + exts[i++];
    });
    img.src = dir + encodeURIComponent(item.file) + (hasExt ? "" : "." + exts[i++]);
    var cap = document.createElement("figcaption");
    cap.textContent = desc;
    fig.appendChild(img); fig.appendChild(cap);
    fig.addEventListener("click", function () {
      var was = fig.classList.contains("open");
      grid.querySelectorAll("figure.open").forEach(function (f) { f.classList.remove("open"); });
      if (!was) fig.classList.add("open");
    });
    return fig;
  }

  Promise.all([getText(dir + "captions.txt"), listFolder()]).then(function (res) {
    var items = [], byKey = {};
    parseCaptions(res[0]).forEach(function (c) {
      items.push(c);
      byKey[c.file.toLowerCase()] = c;
      byKey[c.file.replace(imgExt, "").toLowerCase()] = c;
    });
    res[1].forEach(function (name) {
      var hit = byKey[name.toLowerCase()] || byKey[name.replace(imgExt, "").toLowerCase()];
      if (hit) { hit.file = name; }
      else { items.push({ file: name, desc: "" }); }
    });
    items.forEach(function (it) { grid.appendChild(build(it)); });
    root.hidden = items.length === 0;
  });
})();
