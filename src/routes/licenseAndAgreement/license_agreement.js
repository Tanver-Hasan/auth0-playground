const express = require("express");
const router = express.Router();
const logger = require("../../logger/logger");


router.get("/license", (req,res)=>{    
    console.log("Auth header:", req.headers.authorization);
    console.log("Session info:", req.session);
    console.log("OIDC object:", req.oidc);
    res.render("LicenseAndAgreement");

})

router.post("/license", (req,res)=>{
    console.log("Auth header:", req.headers.authorization);
    console.log("Session info:", req.session);
    console.log("OIDC object:", req.oidc);
    logger.info("License Updated");
    res.redirect("/")
})

module.exports = router;