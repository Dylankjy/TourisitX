// Slideshow for hero
let hero = 1
setInterval(() => {
    $('section.hero#main-hero').removeClass('preload-' + hero)
    hero++
    $('section.hero#main-hero').addClass('preload-' + hero)
    if (hero > 10) {
        $('section.hero#main-hero').removeClass('preload-' + hero)
        hero = 0
    }
}, 5000)
