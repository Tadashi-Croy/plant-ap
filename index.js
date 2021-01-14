const express = require('express');
const path = require('path')
const pgp = require('pg-promise')
var $ = require('jquery')
const app = express();
require('dotenv').config()
const axios = require('axios').default
var session = require('express-session')
var compression = require('compression')
var bodyParser = require('body-parser');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});





const routes = require('./login/routes')
const i = require('./quiz/auxi')


app.use(compression())
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// app.use('/static', express.static(path.join(__dirname, 'public')))

app.use(session({
    // store: new (require('connect-pg-simple')(session))(),
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
  

}));

app.use(express.static("public"))


app.get('/', async (req, res, next) => {

    console.log(process.env.PORT)
    // console.log(routes.db1)
    // console.log(req.session.id, 'id')
    // console.log(req.session)
    // routes.dataB.empty()
    // let y = await routes.dataB.getAll().catch((err)=>{
    //     console.log(err)
    //     routes.dataB.empty()
    // })
    
    // console.log(y)

    res.render('index', { item: '' })
    next()


})
.get('/db', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM test_table');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/db', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })







app.post('/search', async function(req, res, next) {

    let userInput = req.body['userInput']

    if (!userInput.trim()) {
        res.render('index', { item: ['Invalid Input'] })
        return
    }

    let token = '&token=4VDKQB-X24pEbT5eiPFXfX9NeAH_9rwfq6noSTMfknM'
    let urlAPI = 'https://trefle.io/api/v1/plants/search?'
    let fullURL = urlAPI + 'q=' + userInput.trim() + token

    let body = await axios.get(fullURL)
    let ob = body.data.data.slice(0, 5)
    ob = ob.filter((item)=> item['common_name'] !== null)
    ob = ob.map((item) => { return [item['common_name'], item['id']] })

    res.render('index', { item: ob })

})

app.get('/info', async function(req, res) {

    let body
    let plantID = req.query.q

    if (plantID === 'potd') {


        let apiURL = 'https://trefle.io/api/v1/plants?page=3&'
        let endU = 'filter_not[common_name]=null&filter_not[image_url]=null&token=4VDKQB-X24pEbT5eiPFXfX9NeAH_9rwfq6noSTMfknM'

        let d = new Date()

        let potd = d.getDate() + d.getDay() + d.getYear()

        let fullURL = apiURL + endU

        body = await axios.get(fullURL)
            .catch((err) => {
                console.log('here')
                console.log(err)
        })
        plantID = body.data.data[0]['id']
      
    }
    

    let fullURL = 'https://trefle.io/api/v1/plants/' + plantID + '?filter_not[common_name]=null&filter_not[image_url]=null&token=4VDKQB-X24pEbT5eiPFXfX9NeAH_9rwfq6noSTMfknM'

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
            console.log('default')

    }

    routes.dataB.set(req.session.id, body[0])
    console.log(body[0])
    res.json({ data: body[1], session_id: req.session.id,question: qs })
    next()

})

app.post('/quizhtml', async (req, res, next) => {
    
    let body = req.body
    let ans = await routes.dataB.get(body.session_id).catch((err)=>{
        console.log('this happened')
        console.log(err)
        return 1
    })

    // console.log(body)
    // console.log(ans)

    try{
        ans['correctAnswer']['common_name']
    }
    catch(err){
        console.log('Try error')
        console.log(err)
        return
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
    routes.dataB.delete(body.session_id)
})

app.post('/quizhtml/score', (req, res, next) =>{
    console.log(req.body)
    let body = req.body
    console.log(req.session)
    res.status(200).send(req.body)
    next()
})



app.get('/quiz', (req, res, next) => {


    let user = { loggedIn: false, name: 'testUser', score: 0 }

    res.render('quizlett', { user: user })
    next()
})






app.get('/login', (req, res, next) => {
    let user = { loggedIn: false }

    res.render('login-signup', { user: user })
    next()
})

app.post('/login', async (req, res, next) => {
    let data = req.body

    if (req.query.signup === 'signup') {
        console.log('signup')

        if (data.userPass.length <= 16 && data.userPass.length >= 8) {
            console.log(data.userPass.length)
            routes.newUser(data)
            res.redirect('/login')
        }
        else {
            res.status(403).render('login-signup')
            res.end()
        }
        next()
    }
    else {

        let userProfile = await routes.findUser(data)
        if (userProfile) {
            var match = await routes.verifyUser(data.userPass, userProfile['hash'])
        }


        let user = { loggedIn: match }

        if (user.loggedIn) {
            user = {
                name: req.body.username,
                score: userProfile['score'],
                loggedIn: true,

            }

            res.render('quizlett', { user: user })
        }
        else {
            res.redirect('/login')
        }

    }

})





app.use(function(err, req, res, next) {
    res.status(400).send(err.message)
})




app.listen(process.env.PORT, () => {
    console.log('server started');

});