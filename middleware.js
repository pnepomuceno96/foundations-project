const dao = require('./daos/userDao');
const express = require('express');
const server = express()

// Make sure request for registration includes both a username and password
function validateRegistration(req, res, next) {
    if (!req.body.username || !req.body.password) {
        res.statusCode = 401
        res.send({message: 'Username and/or Password is missing'})
        req.body.valid = false;
        //next()
    } else {
        // Make sure username is not already taken
        dao.getUserByUsername(req.body.username)
            .then((data) => {
                if (data.Items === undefined || data.Items.length ==0){
                    req.body.valid = true;
                    next()
                } else {
                    res.statusCode = 400
                    res.send({message: 'Username is already taken'})
                    req.body.valid = false;
                    
                }
            })
            .catch(() => {
                res.statusCode = 400
                res.send({message: `Error fetching username: ${err}`})
            })
        
    }
}

function validateTicket(req, res, next) {
    const validTypes = ["Travel", "Lodging", "Food", "Other"]
    if(!req.body.amount || !req.body.reason || !req.body.type) {
        req.body.valid = false;
        next()
    } else {
        if (validTypes.includes(req.body.type)) {
            req.body.valid = true;
            next()
        } else {
            req.body.valid = false;
            next()
        }
    }
}

function validateUserCredentials(req, res, next) {
    console.log("req.body.username = ", req.body.username)
    dao.getUserByUsername(req.body.username)
        .then((data) => {
            if (data.Items[0].password == req.body.password) {
                req.body.valid = true;
                next()
            } else {
                req.body.valid = false;
                next()
            }
        })
        .catch((err) => {
            res.statusCode = 401
            res.send({message: `Error fetching username: ${err}`})
        })
}



module.exports = {
    validateRegistration, validateUserCredentials, validateTicket
}