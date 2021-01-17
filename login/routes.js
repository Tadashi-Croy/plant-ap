
const bcrypt = require('bcrypt');
const saltRounds = 1;
const { Client } = require('pg')
const format = require('pg-format');
const util = require('util')

const loginUser = async function(userInfo, client){
    let user= await findUser(userInfo.username, client)
    return [user[0][1], user[0][2]]
    
}

const findUser = async function(username, client){
    let sql = format("SELECT name, password, score FROM my_db WHERE name = %L ", username)
    
    let result = await client.query({
        rowMode : 'array',
        text : sql
        }
    )
    .then((item)=>{
        return item.rows
    })

    return result
}

exports.verifyUser = async function(password, hash){
     
    
    let match = await bcrypt.compareSync(password, hash, function(err, result) {
        return result
        })

    return match
}





newUser = async function (userInfo, client){
    
    let a = await findUser(userInfo.username, client)
    
    if(a.length){
        return 'Username Taken'
    }
    else{
        bcrypt.hash(userInfo.userPass, saltRounds, function(err, hash) {
            let sql = format("INSERT INTO my_db(name, password, score) VALUES(%L,%L, 0);", userInfo.username, hash)
            
            client.query(sql, (err, res) => {
                if (err) throw err;

                client.end();       
            })  
            })
    }
    return 1
}


exports.conn = function (op,data){

    const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: {
        rejectUnauthorized: false,
        sslmode : 'require',
    },
        
    })

    client.connect();
    
    switch(op){

        case 'login':
            let c = loginUser(data, client)
            return c
    
        case 'newUser':
           
            let b = newUser(data, client)

            return b
        
        case 'deleteUser':
            deleteUser()

            break
        default:
            client.end()
            
    }

}

exports.saveScore = function(user){
    let sql = format("UPDATE my_db SET score = score + 10 WHERE name = %L", user)
    const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: {
        rejectUnauthorized: false,
        sslmode : 'require',
    },
        
    })
    client.connect()

    client.query(sql, (res, err)=>{
        client.end()  
    })

}


