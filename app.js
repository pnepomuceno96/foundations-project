const AWS = require('aws-sdk');

//set aws region
AWS.config.update({
    region: 'us-east-2'
});

const dynamoDB = new AWS.DynamoDB()

dynamoDB.listTables({}, (err, data) => {
    if(err) {
        console.error('Error', err);
    }else{
        console.log('Tables:', data.TableNames);
        console.log('Full Data: ', data);
    }
});

 ////////
// Array-based version of code
/////////
const users = []
const requests = []

