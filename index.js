const express = require('express')
const bodyParser = require('body-parser')
const app = express().use(bodyParser.json())

app.listen(process.env.PORT || 1337, () => console.log("Webhook is listening"))
app.post("/webhook", (req,res) => {
    let body = req.body
    if (body.object === 'page') {
        body.entry.forEach( entry => {
            let webhook_event = entry.messaging[0]
            console.log(webhook_event)
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
