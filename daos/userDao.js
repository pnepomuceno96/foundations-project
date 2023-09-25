const AWS = require('aws-sdk');

AWS.config.update({
    region: 'us-east-2'
});

const docClient = new AWS.DynamoDB.DocumentClient();

function addUser(user_id, username, password, pastTickets, isFinanceManager) {
    const params = {
        TableName: 'users',
        Item: {
            user_id,
            username,
            password,
            pastTickets,
            isFinanceManager
        }
    }
    return docClient.put(params).promise();
};

function getUserByUserId(user_id) {
    const params = {
        TableName: 'users',
        FilterExpression: '#u = :value',
        ExpressionAttributeNames: {
            '#u': 'user_id'
        },
        ExpressionAttributeValues: {
            ':value': user_id
        }
    }
    console.log("getUserByUserId = " + docClient.scan(params).promise())
    return docClient.scan(params).promise()
}

function getUserByUsername(username) {
    const params = {
        TableName: 'users',
        FilterExpression: '#u = :value',
        ExpressionAttributeNames: {
            '#u': 'username'
        },
        ExpressionAttributeValues: {
            ':value': username
        }
        // Key: {
        //     username
        // }
    }
    //const result = docClient.scan(params).promise()
    //console.log("result of getUserByUsername: ", result)
    return docClient.scan(params).promise()
}

function getUserByUsernameAndPassword(username, password) {
    const params = {
        TableName: 'users',
        Key: {
            username,
            password
        }
    }
    return docClient.scan(params).promise()
}

function addTicketToUser(user_id, ticket, res) {
    console.log("Line 81 user_id = " + user_id)
    let currentTix = []
    getUserByUserId(user_id).then((data) => {
        currentTix = data.Items[0].pastTickets
    })
    .catch((err) => {
        res.send({message: "error fetching previous tickets: "+err})
    })
    console.log(`currentTix = ${currentTix}`)
    const params = {
        TableName: 'users',
        Key: { user_id },
        UpdateExpression: 'set #t = :value',
        ExpressionAttributeNames: {
            '#t': 'pastTickets'
        },
        ExpressionAttributeValues: {
            // add ticket to list of user's pendingRequests
            // get list of user's other tickets
            ':value': currentTix + ticket
            
        }
    }
    return docClient.update(params).promise()
}


module.exports = {
    addUser, getUserByUsernameAndPassword, getUserByUsername, getUserByUserId, addTicketToUser
}