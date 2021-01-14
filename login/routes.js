const Database = require("@replit/database")
const bcrypt = require('bcrypt');
const saltRounds = 1;
const db = new Database()

const pgp = require('pg-promise') ()


const cn = {
    host: process.env.HOST,
    port: process.env.PORT,
    database: process.env.DATABASE,
    user: process.env.USER,
    password: process.env.PASSWORD,
    max: 20
};


const db1 = pgp(cn);

exports.dataB = db

exports.db1 = db1
// Preparing the connection details:
// const cn = 'postgres://username:password@host:port/database';

// Creating a new database instance from the connection details:
// const db = pgp(cn);

// Exporting the database object for shared use:
// module.exports = db;
// const cn = {
//     host: 'localhost',
//     port: 5432,
//     database: 'my-database-name',
//     user: 'user-name',
//     password: 'user-password',
//     max: 30 // use up to 30 connections

//     // "types" - in case you want to set custom type parsers on the pool level
// };



exports.findUser = async function(username){
    
    let user = await db.get(username.username)

    if (user !== null){
        

        return user
       
    }
    else{
        return false
    }

}


exports.verifyUser = async function(password, hash){
     
    
    let match = await bcrypt.compareSync(password, hash, function(err, result) {
        return result
        })

    return match
}





exports.newUser = function (userInfo){
    
    bcrypt.hash(userInfo.userPass, saltRounds, function(err, hash) {
    // Store hash in your password DB.
        db.set(userInfo.username, {hash: hash, score: 0})
    });

}

