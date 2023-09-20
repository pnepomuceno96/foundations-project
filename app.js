const http = require('http')
const express = require('express')
const server = express()
const uuid = require('uuid');
const {createLogger, transports, format} = require('winston')
const url = require('node:url');
const PORT = 3000;
const bodyParser = require('body-parser');
const userDao = require('./daos/userDao');
const ticketDao = require('./daos/ticketDao')
const mw = require('./middleware')
const AWS = require('aws-sdk');

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

const users = []
const requests = []

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
        userDao.addUser(uuid.v4(), body.username, body.password, {}, {}, false)
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

server.get('/users', mw.validateUserCredentials, (req, res) => {
    const body = req.body;
    if(req.body.valid) {
        userDao.getUserByUsername(body.username)
            .then((data) => {
                res.send({
                    message: `Successfully logged in to ${data.Items[0].username}'s account`
                })
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

server.listen(PORT, () => {
    console.log("Server is listening on port ", PORT)
})

/*
const server = http.createServer((req, res) => {
    if (req.url === '/api/users') {
        switch(req.method) {
            case('GET'):
                //Get logic
                logger.info('Retrieving data')
                res.writeHead(200, {'Content-Type': 'application/json'})
                res.end(JSON.stringify(users))
                break;
            case('POST'):
                //Post logic
                let postBody = '';
                req.on('data', (chunk) => {
                    postBody += chunk;
                })
                req.on('end', () => {
                    const data = JSON.parse(postBody);
                    users.push(data)
                    logger.info(`Resource created. \nUser ID: ${data.user_id} \nUsername: ${data.username} \nIs Finance Manager? ${data.isFinanceManager}`);
                    res.writeHead(201, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify({message: 'User Registerd Successfully'}))
                })
                break;
            case('PUT'):
                //Put logic
                let putBody = '';
                req.on('data', (chunk) => {
                    putBody += chunk;
                });
                req.on('end', () => {
                    const data = JSON.parse(putBody)

                    for (let i = 0; i < users.length; i++) {
                        if (data.user_id === users[i].user_id) {
                            users[i] = data
                        }
                    }
                    
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({message: 'User Updated Successfully'}));
                })
                break;
            case('DELETE'):
                //Delete logic
                const requestUrl = url.parse(req.url).query;
                // search for user to delete via user_id
                for(let i = 0; i< users.length; i++) {
                    if (requestUrl === users[i].user_id) {
                        users.splice(i, 1)
                    }
                }
                res.writeHead(201, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'User Deleted Successfully'}));
                break;
        }
    } else if (req.url === '/api/tickets') {
        switch(req.method) {
            case('GET'):
                //Get logic
                res.writeHead(200, {'Content-Type': 'application/json'})
                res.end(JSON.stringify(requests))
                break;
            case('POST'):
                //Post logic
                let postTicketBody = '';
                req.on('data', (chunk) => {
                    postTicketBody += chunk;
                });
                req.on('end', () => {
                    const data = JSON.parse(postTicketBody);
                    requests.push(data);

                    res.writeHead(201, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify({message: 'Ticket Created Successfully!'}))
                });
                break;
            case('PUT'):
                //Put logic
                let putTicketBody = '';
                req.on('data', (chunk) => {
                    putTicketBody += chunk;
                });
                req.on('end', () => {
                    const data = JSON.parse(putTicketBody)

                    for (let i = 0; i < requests.length; i++) {
                        if (data.request_id === requests[i].request_id) {
                            requests[i] = data
                        }
                    }
                    
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({message: 'Ticket Updated Successfully'}));
                })
                break;
            case('DELETE'):
                //Delete logic
                const requestUrl = url.parse(req.url).query;
                // search for ticket to delete via request_id
                for(let i = 0; i< requests.length; i++) {
                    if (requestUrl === requests[i].request_id) {
                        requests.splice(i, 1)
                    }
                }
                res.writeHead(201, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({message: 'Ticket Deleted Successfully'}));
                break;

        }
    }
})


////////
// Temp array-based version of code
/////////

let uidCounter = 0;
let requestidCounter = 0;
let currentUser = {}
function home() {
    console.log('Welcome! Input an option:\n(1) Register\n(2) Login\n(3) View All Tickets\n(4) Create request')
    rl.question('Input: ', (i) => {
        switch(i) {
            case('1'):
                registerUser()
                break;
            case('4'):
                createTicket()


        }
    })
}

function login() {

}

function registerUser() {
    const user = {user_id: uidCounter, pastTickets: [], pendingRequests: []}

    rl.question('Set username: ', (n) => {
        user.username = n;
        rl.question('Set password: ', (p) => {
            user.password = p;
            rl.question('Are you a finance manager? (y/n) ', (a) => {
                switch(a) {
                    case 'y':
                        user.isFinanceManager = true;
                        break;
                    case 'n':
                        user.isFinanceManager = false;
                        break;
                    default:
                        console.log("Invalid input");
                        
                }
                users.push(user)
                uidCounter += 1;
                console.log(users)
            },)
        })
    })
}

function createTicket() {
    const ticket = {request_id: requestidCounter, status: "pending"}
    rl.question("Enter requested amount: ", (n) => {
        ticket.amount = n;
        rl.question("Reason for request: ", (r) => {
            ticket.reason = r;
            requests.push(ticket)
            requestidCounter += 1;
            console.log(requests)
        })
    })
}*/
