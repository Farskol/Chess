
let t = titleEquals('Baby Play Mat 79" X 71",Reversible Waterproof Foldable Foam Floor Playmat for Kids Toddlers, Extra Large Anti- Slip Baby Crawling Mat',
    'Waterproof wear resistant Baby GYM Toy crawling mat baby xpe foldable baby play mat for bedroom');

console.log(t)


function titleEquals(titleAm,titleAl){
    titleAl = titleAl.split(/\s+/)
    let j = 0;

    for (let i = 0; i < titleAl.length; i++){
        let exp = new RegExp(`${titleAl[i]}`,'gi')
        if(exp.test(titleAm)){
            j++;
        }
    }

    return j / titleAl.length > 0.6;

}