const dao = require('./daos/userDao')
const express = require('express');
const server = express()

// Make sure request for registration includes both a username and password
function validateRegistration(req, res, next) {
    if (!req.body.username || !req.body.password) {
        req.body.valid = false;
        next()
    } else {
        req.body.valid = true;
        // TODO: Also ensure that username is not already taken
        next()
    }
}

function validateUserCredentials(req, res, next) {
    console.log("req.body.username = ", req.body.username)
    dao.getUserByUsername(req.body.username)
        .then((data) => {
            console.log("Data = ", data)
            if (data.Items[0].password == req.body.password) {
                req.body.valid = true;
                next()
            } else {
                req.body.valid = false;
                next()
            }
        })
        .catch((err) => {
            res.send({message: `Error fetching username: ${err}`})
        })
}


module.exports = {
    validateRegistration, validateUserCredentials
}