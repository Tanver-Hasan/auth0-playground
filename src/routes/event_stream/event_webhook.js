const express = require("express");
const router = express.Router();
const logger = require("../../logger/logger");


router.get("/event-stream", (req,res)=>{
    console.log("Auth header:", req.headers.authorization);
    console.log("Session info:", req.session);
    console.log("OIDC object:", req.oidc);
    res.send("Auth0 Webhook Listener Running");

})

router.post("/event-stream", (req,res)=>{
    console.log("Auth header:", req.headers.authorization);
    console.log("Session info:", req.session);
    console.log("OIDC object:", req.oidc);
    console.log("Webhook received:", req.body);
    logger.info("Event Stream Post endpoint");
    res.status(200).send("Event received");
})

module.exports = router;