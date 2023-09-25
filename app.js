const express = require('express')
const server = express()
const uuid = require('uuid');
const {createLogger, transports, format} = require('winston')
const url = require('node:url');
const URL = require('url').URL;
const PORT = 3000;
const baseUrl = `http://localhost:${PORT}`
const bodyParser = require('body-parser');
const userDao = require('./daos/userDao');
const ticketDao = require('./daos/ticketDao')
const mw = require('./middleware')
const AWS = require('aws-sdk');
const cookieParser = require('cookie-parser')
const jwtUtil = require('./jwtUtil');

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(({timestamp, level, message}) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new transports.Console()
    ]
})


//set aws region
// AWS.config.update({
//     region: 'us-east-2'
// });
server.use(cookieParser())

const dynamoDB = new AWS.DynamoDB()

dynamoDB.listTables({}, (err, data) => {
    if(err) {
        console.error('Error', err);
    }else{
        console.log('Tables:', data.TableNames);
        console.log('Full Data: ', data);
        
    }
});

server.use(bodyParser.json());

server.post('/users', mw.validateRegistration, (req, res) => {
    const body = req.body;
    
    if (req.body.valid) {
        userDao.addUser(uuid.v4(), body.username, body.password, [], false)
            .then(() => {
                res.send({
                    message: "User successfully registered"
                })
            })
            .catch((err) => {
                res.send({message: `Registration failed.\n  Error: ${err}`})
            })
    } else {
        res.send({message: "Invalid username or password"})
    }
})


//post ticket using token
server.post('/tickets', mw.validateTicket, (req, res) => {
    const token = req.headers.authorization.split(' ')[0];
    const body = req.body;
    jwtUtil.verifyTokenAndReturnPayload(token)
        .then((payload) => {
            if (req.body.valid) {
                ticketDao.createTicket(uuid.v4(), body.amount, body.type, body.reason, payload.user_id, "pending")
                    .then((data) => {
                        console.log(`Posted data: ${data}`)
                        userDao.addTicketToUser(payload.user_id, body, res)
                            .then(() => {
                                res.send({
                                    message: "Ticket successfully created"
                                })
                            })
                            .catch((err) => {
                                res.send({
                                    message: `Ticket creation error: ${err}`
                                })
                            })
                    })
                    .catch((err) => {
                        res.send({message: `Ticket creation error: ${err}`})
                    })
            } else {
                res.statusCode = 401
                res.send({message: "Invalid ticket, missing important fields"})
            }
        }).catch((err) => {
            res.statusCode = 401
            res.send({message: `Authorization failed: ${err}`})
        })
})

server.get('/empEndpoint', (req,res) => {
    console.log(req.headers)
    const token = req.headers.authorization.split(' ')[0];

    jwtUtil.verifyTokenAndReturnPayload(token)
        .then((payload) => {
            if(payload.isFinanceManager === false) {
                res.send({
                    message: `Welcome employee ${payload.username}`
                })
            } else {
                res.statusCode = 401;
                res.send({
                    message: "You are not an employee"
                })
            }
        })
        .catch((err) => {
            res.statusCode = 401;
            res.send({
                message: "Failed to authenticate token"
            })

        })
})

server.get('/managersEndpoint', (req,res) => {
    const token = req.headers.authorization.split(' ')[0];

    jwtUtil.verifyTokenAndReturnPayload(token)
        .then((payload) => {
            if(payload.isFinanceManager === true) {
                res.send({
                    message: `Welcome manager ${payload.username}`
                })
            } else {
                res.statusCode = 401;
                res.send({
                    message: "You are not an admin"
                })
            }
        })
        .catch((err) => {
            res.statusCode = 401;
            res.send({
                message: "Failed to authenticate token"
            })

        })
})

server.get('/users', mw.validateUserCredentials, (req, res) => {
    //const token = req.headers.authorization.split(' ')[1];
    //console.log(token)
    const body = req.body;
    if(req.body.valid) {
        userDao.getUserByUsername(body.username)
            .then((data) => {
                const user = data.Items[0]
                const token = jwtUtil.createJWT(user.user_id, user.username, user.isFinanceManager);
                
                res.send({
                    message: `Successfully authenticated ${user.username}`,
                    token: token
                })
                // if(user.isFinanceManager == false) {
                //     empEndpoint(res, req)
                // } else if (user.isFinanceManager == true) {
                //     adminsEndpoint(res, req)
                // } else {
                //     res.statusCode = 401;
                //     res.send({
                //         message: "You do not have a role in the company!"
                //     })
                // }
                
            })
            .catch((err) => {
                res.send({
                    message: `Login failed;\n    Server side error: ${err}`
                })
            })
    } else {
        res.send({
            message: "Login failed; Invalid credentials"
        })
    }
})

server.get('/tickets/pending', (req, res) => {
    ticketDao.getPendingTickets()
        .then((data) => {
            res.send({
                message: "Successfully retrieved pending tickets",
                body: data.Items
            })
            console.log(data.Items)
        })
        .catch((err) => {
            
            res.send({
                message: `Ticket retrieval error: ${err}`
            })
        })
    
})


// Get tickets by the user token
server.get('/tickets', (req, res) => {
    //logger.info("Getting all user's tickets")

    //require authorization
    const token = req.headers.authorization.split(' ')[0];
    //const type = 
    const requestUrl = new URL(req.url, baseUrl);
    console.log(requestUrl)
    //console.log("requestUrl = ", requestUrl)
    jwtUtil.verifyTokenAndReturnPayload(token)
        .then((payload) => {
            console.log("payload = " + payload)
            if(!requestUrl.search) {
                ticketDao.getTicketsByRequesterId(payload.user_id)
                    .then((data) => {
                        res.send({
                            message: "Successfully retrieved tickets",
                            body: data.Items
                        })
                        console.log(data.Items)
                    }).catch((err) => {
                        res.statusCode = 401;
                        res.send({message: `Ticket retrieval failure: ${err}`})
                    })
            } else {
                //let params = new URLSearchParams(requestUrl)
                const type = requestUrl.searchParams.get('type')
                console.log("type = " + type)
                ticketDao.getUsersTicketsByType(payload.user_id, type)
                    .then((data) => {
                        res.send({
                            message: "Successfully retrieved tickets",
                            body: data.Items
                        })
                        console.log(data.Items)
                    }).catch((err) => {
                        res.statusCode = 401;
                        res.send({message: `Ticket retrieval failure. ${err}`})
                    })
            }
        })
        .catch((err) => {
            res.statusCode = 401
            res.send({message: `Failed to authenticate token. ${err}`})
        })
    }
)

//PUT: change user role (isFinanceManager)
server.put('/users', (req, res) => {
    const token = req.headers.authorization.split(' ')[0];
    const requestUrl = new URL(req.url, baseUrl);
    const id = requestUrl.searchParams.get('id')
    
    //const body = req.body;
    jwtUtil.verifyTokenAndReturnPayload(token)
        .then((payload) => {
            if(payload.isFinanceManager === true) {
                userDao.getUserByUserId(id).then((data) => {
                    //Alternate whether or not the user is a manager
                    userDao.changeUserRole(id, !data.Items[0].isFinanceManager).then(() => {
                        res.send({
                            message: `Successfully changed ${data.Items[0].username}'s role`
                        })
                    }).catch((err) => {
                        res.statusCode = 401
                        res.send({message: `Error changing role. ${err}`})
                    })
                }).catch((err) => {
                    res.statusCode = 401
                    res.send({message: `Error fetching user. ${err}`})
                })
            } else {
                res.statusCode = 401
                res.send({message: "You are not authorized to change user roles."})
            }
        }).catch((err) => {
            res.statusCode = 401
            res.send({message: `Authorization error. ${err}`})
        })
})

//PUT: change ticket status
server.put('/tickets', (req, res) => {
    const token = req.headers.authorization.split(' ')[0];
    const requestUrl = new URL(req.url, baseUrl);
    const id = requestUrl.searchParams.get('id')
    
    const body = req.body;
    console.log("body = ", body)
    //console.log("requestUrl = ", requestUrl)
    jwtUtil.verifyTokenAndReturnPayload(token)
        .then((payload) => {
            // Make sure that the user processing the ticket is a manager
            if(payload.isFinanceManager === true) {
                // Make sure that the ticket in question is still pending(not previously processed)
                ticketDao.getTicketById(id).then((data) => {
                    console.log(`line 251 | data = ${data.Item}`)
                    if (data.Item.status === 'pending') {
                        ticketDao.setTicketStatusById(id, body.status)
                            .then(() => {
                                res.send({
                                    message: `Successfully ${body.status} ticket ${id}`
                                })
                            }).catch((err) => {
                                res.statusCode = 401
                                res.send({message: `Error: ${err}`})
                            })
                    } else {
                        res.statusCode = 401,
                        res.send({message: "Ticket has already been processed"})
                    }
                }).catch((err) => {
                    res.statusCode = 401,
                    res.send({message: `Ticket retrieval error: ${err}`})
                })
            } else {
                res.statusCode = 401,
                res.send({message: 'You are not authorized to process tickets!'})
            }
        })
        .catch((err) => {
            res.statusCode = 401,
            res.send({message: `Authorization error: ${err}`})
        })
})

server.listen(PORT, () => {
    console.log("Server is listening on port ", PORT)
})