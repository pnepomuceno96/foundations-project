const AWS = require('aws-sdk');

AWS.config.update({
    region: 'us-east-2'
});

const docClient = new AWS.DynamoDB.DocumentClient();

function createTicket(request_id, amount, reason, requester_id, status) {
    const params = {
        TableName: 'requests',
        Item: {
            request_id,
            amount,
            reason,
            requester_id,
            status
        }
    }
    return docClient.put(params).promise();
};

function getPendingTickets() {
    const params = {
        TableName: 'requests',
        FilterExpression: '#s = :value',
        ExpressionAttributeNames: {
            '#s': 'status'
        },
        ExpressionAttributeValues: {
            ':value': 'pending'
        }
    };
    return docClient.scan(params).promise();
}

//Accept or deny ticket/request
function setTicketStatusById(request_id, status) {
    const params = {
        TableName: 'requests',
        Key: { request_id },
        UpdateExpression: 'set #s = :value',
        ExpressionAttributeNames: {
            '#s': 'status'
        },
        ExpressionAttributeValues: {
            ':value': status
        }
    }
    return docClient.update(params).promise()
}

module.exports = {
    createTicket, getPendingTickets, setTicketStatusById
}