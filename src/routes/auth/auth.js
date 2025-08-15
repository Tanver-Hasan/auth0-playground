
const express = require("express");
const logger = require("../../logger/logger");
const router = express.Router();

router.get('/login', (req, res) => {
    logger.info("Login Request Query Params:", JSON.stringify(req.query));

    const {
        session_transfer_token,
        invitation,
        organization,
        organization_name,
        'ext-manage-profile': extManageProfile // fixing invalid variable name
    } = req.query;

    const authorizationParams = {
        redirect_uri: process.env.AUTH0_CALLBACK_URL,
        ...(session_transfer_token && { session_transfer_token }),
        ...(invitation && { invitation }),
        ...(organization && { organization }),
        ...(organization_name && { organization_name }),
        ...(extManageProfile && { 'ext-manage-profile': extManageProfile }),
        connection: process.env.CONNECTION || ""
    };

    // Authorization Code Flow /authorize?response_type=code
    res.oidc.login({
        returnTo: '/profile',
        authorizationParams
    });
});



router.get('/silent-auth', (req, res) => {
    logger.info("Silent Authentication");

    let authorizationParams = {
        redirect_uri: process.env.AUTH0_CALLBACK_URL,
        prompt: 'none'
    }
    res.oidc.login({
        returnTo: '/profile',
        authorizationParams
    })
}
);

router.get('/refresh-token', async (req, res) => {

    logger.info("Refresh Token");
    let access_token = req.oidc.accessToken;
    const tokens = await access_token.refresh();
    if (tokens) {
        logger.info(JSON.stringify(tokens));
        res.render('Home', {
            isAuthenticated: req.oidc.isAuthenticated(),
            user: req.oidc.user
        });
    }
}
);

router.get('/custom-logout', (req, res) => {
    res.render('logout', { message: "You have been successfully logged out!" });
});


router.get('/callback', (req, res) => {
    logger.info("Callback query params:", JSON.stringify(req.query));

    const { error, error_description } = req.query;
  
    if (error) {
        logger.error(`OIDC callback error: ${error} - ${error_description}`);
        return res.status(400).render('auth-error', {
          error,
          error_description,
        });
      }

    res.oidc.callback({
        redirectUri: process.env.AUTH0_CALLBACK_URL,
    })
});

router.post('/callback', express.urlencoded({ extended: false }), (req, res) =>
    res.oidc.callback({
        redirectUri: process.env.AUTH0_CALLBACK_URL,
    })
);



module.exports = router;


