const express = require('express')
const bodyParser = require('body-parser')
const app = express().use(bodyParser.json())
const request = require('request')
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN

app.listen(process.env.PORT || 1337, () => console.log("Webhook is listening"))
app.post("/webhook", (req,res) => {
    let body = req.body
    if (body.object === 'page') {
        body.entry.forEach( entry => {
            let webhook_event = entry.messaging[0]
            console.log(webhook_event)
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid)
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message)
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback)
            }
        });
        res.status(200).send("Event received")
    } else {
        res.sendStatus(404)
    }
})

app.get("/webhook", (req, res) => {
    let VERIFY_TOKEN = "supersecret"

    let mode = req.query["hub.mode"]
    let token = req.query["hub.verify_token"]
    let challenge = req.query["hub.challenge"]

    if (token&&mode) {
        if (mode === "subscribe" && token == VERIFY_TOKEN) {
            console.log("Webhook verified")
            res.status(200).send(challenge)
        } else {
            res.sendStatus(403)
        }
    }
})

// Handles messages events
function handleMessage(sender_psid, received_message) {
    let response;
    if (received_message.text) {
        response = {
            "text": `You send the message: "${received_message.text}". Now send me an image!`
        }
    } else if (received_message.attachments) {
        let attachments_url = received_message.attachments[0].payload.url
        response = {
            "attachment": {
              "type": "template",
              "payload": {
                "template_type": "generic",
                "elements": [{
                  "title": "Is this the right picture?",
                  "subtitle": "Tap a button to answer.",
                  "image_url": attachment_url,
                  "buttons": [
                    {
                      "type": "postback",
                      "title": "Yes!",
                      "payload": "yes",
                    },
                    {
                      "type": "postback",
                      "title": "No!",
                      "payload": "no",
                    }
                  ],
                }]
              }
            }
          }
    }
    callSendAPI(sender_psid, response)
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;
  
    // Get the payload for the postback
    let payload = received_postback.payload;
  
    // Set the response based on the postback payload
    if (payload === 'yes') {
      response = { "text": "Thanks!" }
    } else if (payload === 'no') {
      response = { "text": "Oops, try sending another image." }
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    let request_body = {
        "recipient": {
          "id": sender_psid
        },
        "message": response
    }
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": process.env.PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
      }, (err, res, body) => {
        if (!err) {
          console.log('message sent!')
        } else {
          console.error("Unable to send message:" + err);
        }
      }); 
      
}