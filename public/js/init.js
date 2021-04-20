NProgress.configure({
    trickle: true,
    easing: 'ease', 
    speed: 350
});

$(document).on('turbolinks:click', function () {
    NProgress.start();
});

$(document).on('turbolinks:load', function () {
    NProgress.done();
});

$(document).on('ready', function () {
    $(window).on('load', function () {
        NProgress.done();
        Turbolinks.start()
    });
});
