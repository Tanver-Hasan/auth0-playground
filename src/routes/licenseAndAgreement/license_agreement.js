const express = require("express");
const router = express.Router();
const logger = require("../../logger/logger");


router.get("/license", (req,res)=>{
    res.render("LicenseAndAgreement");

})

router.post("/license", (req,res)=>{
    logger.info("License Updated");
    res.redirect("/")
})

module.exports = router;