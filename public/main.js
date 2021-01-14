let potdButton = document.querySelector('#potd')
let signUp = document.querySelector('#loginForm')
let signUpBtn = document.querySelector('#signUpBtn')
let submitBtn = document.querySelector('#submitBtn')
let quizType = document.querySelector('#quizType')
let gameBody = document.querySelector('#game')
let gameQ = document.querySelector('#gameQ')
let answers = document.getElementsByClassName('answer')
let startGame = document.querySelector('#startGame')
let result = document.querySelector('#result')


var gameData










if(quizType){
    var scoreNode = document.querySelector('#score')
    var scoreVal = parseInt(scoreNode.innerText.split(' ')[4])
    var sess 

    $(startGame).click(gameChooser)
    

}

if(signUpBtn){
    signUpBtn.addEventListener('click', testFunction)
}



async function gameChooser() {

    $(answers).empty()
    $(result).empty()
    let ii = await $.getJSON('./quizhtml', {body:quizType.value})

    
    if(!ii['question'].startsWith('https')){
        gameQ.innerHTML = `<h2>Which Plant is: ${ii['question']}</h2>` 

    }
    else if(ii['question'].startsWith('https')){

        $(gameQ).addClass("img-200")
        gameQ.innerHTML = `<h2>What Plant is This?</h2> <br><img src="${ii['question']}" <br>`
        
    }

    let rData = ii
    let aNodes = answers
    let gameType = quizType.value

    resultsAnalyzer(rData,aNodes, gameType)

    window.sessionStorage.setItem('id', ii['session_id'])
    

}




function testFunction(){
    $(signUp).attr({ action : '/login?signup=signup'})
    submitBtn.click()

}

function resultsAnalyzer(rData, aNodes, gameType){
    var guess

    for(let i =0; i < 4; i++){

        switch(gameType) {

            case 'nameguess':
                aNodes[i].innerText = rData['data']['choices'][i]
                
                
                break;
            
            case 'picguess':
                $(aNodes[i]).append(`<img src= "${rData['data']['choices'][i]}">`)   
                
               
                
                break;
            default:
                return -1
        }

        
        $(aNodes[i]).addClass('card-test').one('click', function(){
            if(gameType === 'nameguess'){
                guess = aNodes[i].innerText
            }
            else{
                guess = aNodes[i].childNodes[0].src
            }

            $.post('./quizhtml',{guess: guess, session_id: window.sessionStorage.getItem('id')} )
            .done((item)=>{
                if(item === 'Correct!'){
                    scoreVal += 10
                    saveScore()
                    result.innerHTML = '<h3>Correct!</h3>'
                    $(result).addClass('correct')

                }
                else{
                    if(gameType === 'nameguess'){
                        wrong = (item['common_name'])? item['common_name']:item['scientific_name']
                    }
                    else{
                        wrong = `<br> <img src = "${item['image_url']}" />`
                    }

                    result.innerHTML = `<h3>Wrong! It is ${wrong}</h3>`
                    $(result).addClass('incorrect')


                }

                scoreNode.innerText = `Your Score is : ${scoreVal}`
            })
            window.sessionStorage.clear()
            $(aNodes).map((item)=>{return $(answers[item]).off('click')})
            
        })
    }
    
}

async function saveScore() {
    $.post('./quizhtml/score', {score: scoreVal})
    console.log('done')
}




