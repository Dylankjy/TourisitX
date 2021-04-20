NProgress.configure({
    trickle: true,
    easing: 'ease',
    speed: 350,
})

$(document).on('turbolinks:click', () => {
    NProgress.start()
})

$(document).on('turbolinks:load', () => {
    NProgress.done()
})

$(document).on('ready', () => {
    $(window).on('load', () => {
        NProgress.done()
        Turbolinks.start()
    })
})
