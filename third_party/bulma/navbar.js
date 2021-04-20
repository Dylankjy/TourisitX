$(document).on("turbolinks:load", function () {
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function () {
        // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
        $(".navbar-burger").toggleClass("is-active");
        $(".navbar-menu").toggleClass("is-active");
    });
})

$(document).on("turbolinks:click", function () {
        $(".navbar-burger").removeClass("is-active");
        $(".navbar-menu").removeClass("is-active");
})