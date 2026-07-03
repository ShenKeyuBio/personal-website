(function () {
  var languageLinks = document.querySelectorAll("[data-language-choice]");

  languageLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      try {
        window.localStorage.setItem("preferredLanguage", link.getAttribute("data-language-choice") || "");
      } catch (error) {
        // Ignore private browsing or storage-disabled environments.
      }
    });
  });

  document.querySelectorAll(".mobile-nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      var details = link.closest("details");
      if (details) {
        details.removeAttribute("open");
      }
    });
  });
})();
