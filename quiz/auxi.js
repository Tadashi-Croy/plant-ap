let axios = require('axios')



const questionMaker = function(choices, gameType){
    let spl = Math.floor(Math.random()*4)
    let correctAnswer = [...choices][spl]
    
    
    if(gameType === 'picguess'){
        let test = [
            {correctAnswer: correctAnswer},
            {choices: choices.splice(0,4).map((item)=> item['image_url'])}
        ]
        
        return test
    }
    else if(gameType === 'nameguess'){
         let test = [
            {correctAnswer: correctAnswer},
            {choices: choices.splice(0,4).map((item)=>{ 
            
            return (item['common_name'])? item['common_name']: item['scientific_name']
            }
            )}
        ]
        return test
    }
    else{
        return 'Invalid Selection'
    }




    

}



exports.pictureGame = async function(choices, gameType){

    let data = await dataGrabber()
    let quests = await questionMaker(data.data.data, 'picguess')
    


    return quests
}


exports.nameGame = async function(){
    let data = await dataGrabber()
    let quests = await questionMaker(data.data.data, 'nameguess')


    return quests
}


async function dataGrabber(){
    let apiURL = 'https://trefle.io/api/v1/plants?page='
    let endU = 'filter_not[common_name]=null&filter_not[image_url]=null&token='+ process.env.token
    let num = Math.floor(Math.random()*50) + 1
    
    
    let fullURL = apiURL + num + endU
    
    
    let body = await axios.get(fullURL).catch((item)=>{console.log(item)})
    return body
}



