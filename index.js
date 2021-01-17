const express = require('express');
const path = require('path')

const pgp = require('pg-promise')

const app = express();

const axios = require('axios').default
var cookieSession = require('cookie-session')



var compression = require('compression')
var bodyParser = require('body-parser');

const routes = require('./login/routes')
const auxi = require('./quiz/auxi')





app.use(compression())
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const updated = require('./updates.js')


app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


app.use(cookieSession({
  name: 'session',
  keys: ['apple', 'orange'],

  maxAge: 24 * 60 * 60 * 1000, 
  loggedIn: false,
}))








app.use(express.static("public"))




app.get('/', async (req, res, next) => {
    if(req.session.isNew){
        req.session.loggedIn = false
        req.session.answer = ''
        req.session.score = null
    }
    else if(!req.session){
        app.use(cookieSession({
        name: 'session',
        keys: ['apple', 'orange'],

        maxAge: 24 * 60 * 60 * 1000, 
        loggedIn: false,
        }))
        
    }    
   

    res.render('index', { item: '' })
    next()


})

app.post('/search', async function(req, res, next) {

    let userInput = req.body['userInput']

    if (!userInput.trim()) {
        res.render('index', { item: ['Invalid Input'] })
        return
    }
    else if(userInput.trim().length >= 20){
        userInput = userInput.trim().substring(0,20)
    }
    

    let token = '&token=' + process.env.token
    let urlAPI = 'https://trefle.io/api/v1/plants/search?'
    let fullURL = urlAPI + 'q=' + userInput.trim() + token

    let body = await axios.get(fullURL)
    let ob = body.data.data.slice(0, 5)
    ob = ob.filter((item)=> item['common_name'] !== null)
    ob = ob.map((item) => { return [item['common_name'], item['id']] })


    if(!ob.length){
        ob = [-1]
    }

    res.render('index', { item: ob })

})

app.get('/info', async function(req, res) {

    let body
    let plantID = req.query.q

    if (plantID === 'potd') {


        let apiURL = 'https://trefle.io/api/v1/plants?page='
        let endU = '&filter_not[common_name]=null&filter_not[image_url]=null&token=' + process.env.token

        let d = new Date()

        let potd = d.getDate() + d.getDay()

        let fullURL = apiURL + potd  + endU

        body = await axios.get(fullURL)
            .catch((err) => {
                console.log(err)
        })
        plantID = body.data.data[0]['id']
      
    }
    

    let fullURL = 'https://trefle.io/api/v1/plants/' + plantID + '?filter_not[common_name]=null&filter_not[image_url]=null&token=' + process.env.token

    body = await axios.get(fullURL)
        .catch((err) => {
            console.log(err)
    })


    res.render('info', { plant : body.data.data })
    

})


app.get('/about', (req, res, next) => {
   
    res.render('about')
});

app.get('/quizhtml', async (req, res, next) => {
    var qs
    let body = req.query.body
    
    switch (body) {

        case 'picguess':
            body = await auxi.pictureGame()
            qs = body[0]['correctAnswer']['common_name']
            break;
        case 'nameguess':
            body = await auxi.nameGame()
            qs = body[0]['correctAnswer']['image_url']
            break;
        default:
            return -1

    }
    req.session.answer = body[0]
    res.json({ data: body[1], session_id: 'item',question: qs })
    next()

})

app.post('/quizhtml', async (req, res, next) => {
    
    let body = req.body
    let ans = req.session.answer

    try{
        ans['correctAnswer']['common_name']
    }
    catch(err){
        console.log('Try error')

    }



    if(!ans['correctAnswer']['common_name']){
        ans['correctAnswer']['common_name'] = ans['correctAnswer']['scientific_name']
    }

    if (body.guess === ans['correctAnswer']['common_name'] || body.guess === ans['correctAnswer']['image_url']) {
        
        res.status(200).send('Correct!')

    }
    else {

        res.send(ans['correctAnswer'])

    }

})

app.post('/quizhtml/score', (req, res, next) =>{
    
    let body = req.body
    req.session.score = body['score']
    routes.saveScore(req.session.user)


    res.status(200).send(req.body)
    next()
})

app.delete('/quizhtml',async (req,res,next) =>{
    let body = req.body
    req.session.answer = ''


    res.status(200).send('Cleared')
    next()

})


app.get('/quiz', (req, res, next) => {


    let user = { loggedIn: req.session.loggedIn, name: req.session.user, score: req.session.score }

    res.render('quizlett', { user: user })
    next()
})






app.get('/login', (req, res, next) => {

    let user = { loggedIn: req.session.loggedIn, message: '' }
    res.render('login-signup', { user: user })
    next()
})




app.post('/login', async (req, res, next) => {
    let data = req.body
    let message = ''
    let user = {loggedIn: false, message: message}


    if (req.query.signup === 'signup') {

        if (data.userPass.length <= 16 && data.userPass.length >= 8) {
                        
            let check = await routes.conn('newUser',data)
            
            
            if(check === 1){
                message = 'signed Up'
                user = {loggedIn: false, message: message}    
                res.render('login-signup', {user: user})
            
            }
            else if(check === 'Username Taken'){
                message = check
                user = {loggedIn: false, message: message}
                res.render('login-signup', {user: user})
            }
            else{
                message = 'Invalid Sign Up! Please Try Again'
                user = {loggedIn: false, message: message}
                res.render('login-signup', {user: user})
            }
            
            
        }
        else {
            message = 'Invalid Password Length'
            user = {loggedIn: false, message: message}
            res.render('login-signup', {user:user})
            res.end()
        }
        next()
    }
    else {

        let userProfile = await routes.conn('login', data)
        
        if (userProfile) {
            var match = await routes.verifyUser(data.userPass, userProfile[0])
        }

        req.session.loggedIn = match

        if (req.session.loggedIn) {
            req.session.score = userProfile[1] 
        
            req.session.user = data.username
            user = {
                name: req.session.user,
                score: userProfile[1],
                loggedIn: req.session.loggedIn

            }

            res.render('quizlett', { user: user })
        }
        else {
            message = 'Invalid Username or Password'
            user = {loggedIn: false, message: message}
            res.render('login-signup', {user:user})
        }

    }

})


app.get('/logout', (req, res, next)=>{

    req.session = null
    res.redirect('/')
})






app.use(function(err, req, res, next) {
    res.status(400).send(err.message)
})




app.listen(3000, () => {
    console.log('server started');
   
});