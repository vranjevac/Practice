const popular_designs_h2 = document.querySelector('.popular_designs_h2');
const design_your_own_h2 = document.querySelector('.design_your_own_h2');
const popular_designs = document.querySelector('.popular_designs');
const design_your_own = document.querySelector('.design_your_own');
const choose_h2 = document.querySelector('.choose_h2');
const designs = document.querySelector('.designs');
const covers = document.querySelector('.covers');

const body = document.querySelector('body');

// const popular_styles = window.getComputedStyle(popular_designs);
// console.log(popular_styles.visibility);

body.onload = function(){
    design_your_own.style.display = "none";
    covers.style.display = "none";
    design_your_own_h2.style.background = "#e6e6e6";
}

// DESIGN YOUR OWN IS ACTIVATED
design_your_own_h2.addEventListener('click', () => {
    popular_designs.style.display = "none";
    design_your_own.style.display = "flex";
    design_your_own_h2.style.background = "#ffffff";
    popular_designs_h2.style.background = "#e6e6e6";
})

// POPULAR DESIGNS ARE ACTIVATED
popular_designs_h2.addEventListener('click', () => {
    design_your_own.style.display = "none";
    popular_designs.style.display = "flex";
    design_your_own_h2.style.background = "#e6e6e6";
    popular_designs_h2.style.background = "#ffffff";
})

// DESIGNS ARE HIDDEN OR VISIBLE
choose_h2.addEventListener('click', () => {
    if(designs.style.display == "none")
        designs.style.display = "block";
    else
        designs.style.display = "none";
})

// SHOW OR HIDE MATERIALS
const choose_cover = document.querySelector('.choose_cover_popular_h2');
choose_cover.addEventListener('click', () => {
    if(covers.style.display == "none")
        covers.style.display = "block";
    else
        covers.style.display = "none";
})