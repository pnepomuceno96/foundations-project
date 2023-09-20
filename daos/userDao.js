const AWS = require('aws-sdk');

AWS.config.update({
    region: 'us-east-2'
});

const docClient = new AWS.DynamoDB.DocumentClient();

function addUser(user_id, username, password, pastTickets, pendingRequests, isFinanceManager) {
    const params = {
        TableName: 'users',
        Item: {
            user_id,
            username,
            password,
            pastTickets,
            pendingRequests,
            isFinanceManager
        }
    }
    return docClient.put(params).promise();
};

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


module.exports = {
    addUser, getUserByUsernameAndPassword, getUserByUsername
}