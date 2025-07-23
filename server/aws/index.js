import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocument.from(new DynamoDB());
const tableName = "forward";
const statusOK = '200';
const statusBadRequest = '400';
const statusInternalServerError = '500';
const headers = {
    'Content-Type': 'text/plain',
    "Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const handler = async (event, context) => {
    console.log(event);
    let body;
    let httpBody;
    let statusCode = statusOK;

    let query = true;
    if (event.requestContext
        && event.requestContext.http
        && event.requestContext.http.method === "POST"
        && event.body) {
        try {
            httpBody = JSON.parse(event.body);
        } catch (err) {
            body = err.message;
            return {
                statusCode: statusBadRequest,
                body: "expect data but get: " + err.message,
                headers: headers,
            };
        }
        if (httpBody.sms) {
            query = false;
        }
    }

    if (query) {
        return get()
    } else {
        return put(httpBody.sms)
    }
};


async function get() {
    console.log("[get]: prepare to get")  
    let statusCode = statusOK;
    let body;
    let ts = Date.now();
    ts = ts - 1000 * 60 * 10;
    let params = {
        TableName: tableName,
        FilterExpression: "ts > :ts",
        ExpressionAttributeValues: {
            ":ts": ts,
        }
    }

    try {
        let scaned = await dynamo.scan(params);
        scaned.Items.sort((a, b) => b.ts - a.ts);
        body = scaned.Items;
    } catch (err) {
        statusCode = statusInternalServerError;
        body = "faild: " + err.message;
    } finally {

    }
    await clear()
    console.log("[get]: get success")  
    return {
        statusCode,
        body,
        headers,
    };
}

async function put(sms) {
    console.log("[put]: ready to put")  
    let ts = Date.now();
    let statusCode = statusOK;
    let body;

    let msg = {
        TableName: tableName,
        Item: {
            id: ts,
            ts: ts,
            data: sms,
        },
    }
    try {
        await dynamo.put(msg);
        body = "success"
    } catch (err) {
        statusCode = statusInternalServerError;
        body = "faild: " + err.message;
    } finally {

    }
    await clear()
    return {
        statusCode,
        body,
        headers,
    };
}

async function clear() {
    console.log("[clear]: ready to clear");
    let ts = Date.now();
    ts = ts - 1000 * 60 * 60;

    const params = {
        TableName: tableName,
        FilterExpression: "ts < :ts",
        ExpressionAttributeValues: {
            ":ts": ts,
        }
    }
    try {
        let scaned = await dynamo.scan(params);
        for (let item of scaned.Items) {
            console.log("[clear]: delete item: ", item.id);
            const command = new DeleteCommand({
                TableName: tableName,
                Key: {
                    ts: item.id,
                    id: item.ts,
                },
            });
            await dynamo.send(command);
        }
    } catch (err) {
        console.log("[clear]: delete item failed: ", err)
    } finally {

    }
    console.log("[clear]: finish clear")
}