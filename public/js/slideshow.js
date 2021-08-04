// Slideshow for hero
let hero = 2
setInterval(() => {
    $('section.hero#main-hero').removeClass('preload-' + hero)
    hero++
    $('section.hero#main-hero').addClass('preload-' + hero)
    if (hero > 9) {
        $('section.hero#main-hero').removeClass('preload-' + hero)
        hero = 1
    }
}, 5000)
