const AWS = require('aws-sdk');

AWS.config.update({
    region: 'us-east-2'
});

const docClient = new AWS.DynamoDB.DocumentClient();

function createTicket(request_id, amount, type, reason, requester_id, status) {
    const params = {
        TableName: 'requests',
        Item: {
            request_id,
            amount,
            type,
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

function getTicketById(request_id) {
    const params = {
        TableName: 'requests',
        Key: { request_id }
    }
    return docClient.get(params).promise()
}

function getTicketsByRequesterId(requester_id) {
    const params = {
        TableName: 'requests',
        FilterExpression: '#r = :value',
        ExpressionAttributeNames: {
            '#r': 'requester_id'
        },
        ExpressionAttributeValues: {
            ':value': requester_id
        }
    };
    return docClient.scan(params).promise();
}

function getUsersTicketsByType(requester_id, type) {
    const params = {
        TableName: 'requests',
        FilterExpression: '#r = :value AND #t = :value2',
        ExpressionAttributeNames: {
            '#r': 'requester_id',
            '#t': 'type'
        },
        ExpressionAttributeValues: {
            ':value': requester_id,
            ':value2': type
        }
    };
    return docClient.scan(params).promise()
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

//Accept or deny ticket/request with comment
function setTicketStatusWithCommentById(request_id, status, comment) {
    const params = {
        TableName: 'requests',
        Key: { request_id },
        UpdateExpression: 'set #s = :value, #c = :value2',
        ExpressionAttributeNames: {
            '#s': 'status',
            '#c': 'managerComment'
        },
        ExpressionAttributeValues: {
            ':value': status,
            ':value2': comment
        }
    }
    return docClient.update(params).promise()
}

module.exports = {
    createTicket, getPendingTickets, setTicketStatusById, setTicketStatusWithCommentById, 
    getTicketsByRequesterId, getTicketById, getUsersTicketsByType
}