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


module.exports = {
    createTicket
}