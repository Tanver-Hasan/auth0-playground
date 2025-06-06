
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const dotenv = require('dotenv');
const express = require("express");
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const crypto = require('crypto');
const fs = require('fs');
const logger = require("./src/logger/logger");
const { auth, requiresAuth } = require("express-openid-connect");
const MemoryStore = require('memorystore')(auth);
const authRoutes = require("./src/routes/auth/auth");
const licensAndAgreementRoutes = require("./src/routes/licenseAndAgreement/license_agreement")
const progressiveProfilingRoutes = require("./src/routes/progressive_profiling/progressive_profiling");
const eventStreamRoutes = require("./src/routes/event_stream/event_webhook");
dotenv.config();

const port = process.env.PORT || 3000;
const app = express();
app.set('trust proxy', true);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 5 * 60 * 1000
        }
    })
);


app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
});


app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                // Allow inline scripts only if they have the correct nonce
                scriptSrc: [
                    "'self'",
                    (req, res) => `'nonce-${res.locals.nonce}'`
                ],
                formAction: ["'self'", `https://${process.env.AUTH0_DOMAIN}`]
            }
        }
    })
);

app.use((req, res, next) => {
    logger.info(`Received a ${req.method} request for ${req.url}`);
    next();
});

app.use(auth({
    idpLogout: false,
    authRequired: false,
    routes: {
        login: false,
        postLogoutRedirect: 'custom-logout',
        callback: false
    },

    baseURL: process.env.BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
    secret: process.env.SECRET,
    authorizationParams: {
        response_type: 'code',
        audience: process.env.API_AUDIENCE,
        scope: 'openid profile email offline_access',
    },

    session: {
        store: new MemoryStore({
            checkPeriod: 24 * 60 * 1000
        })
    },
    backchannelLogout: true
}));



// Home Page
app.get('/', (req, res) => {
    logger.info("Home Page ")
    res.render('Home', {
        isAuthenticated: req.oidc.isAuthenticated(),
        user: req.oidc.user
    });
})

app.use("/", authRoutes);
app.use("/", licensAndAgreementRoutes);
app.use("/", progressiveProfilingRoutes);
app.use("/", eventStreamRoutes);

// Token Page
app.get('/token', requiresAuth(), (req, res) => {
    res.render('Token', {
        accessToken: req.oidc.accessToken.access_token,
        idToken: req.oidc.idToken,
        refreshToken: req.oidc.refreshToken
    })
});

// Profile Page
app.get('/profile', requiresAuth(), (req, res) => {
    res.render('Profile', { user: req.oidc.user })
});



// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get("env") === "development") {
    app.use((err, req, res) => {
        logger.error(`Error occurred: ${err.message}`);
        res.status(err.status || 500);
        res.render("error", {
            message: err.message,
            error: err,
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res) => {
    logger.error(`Error occurred: ${err.message}`);
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {},
    });
});

const isDevelopment = process.env.NODE_ENV === "development";
const isLocal = !process.env.VERCEL && process.env.NODE_ENV === "development";
if (isLocal) {
    // Load SSL Certificates (For Development Only)
    const https = require("https");
    const options = {
        key: fs.readFileSync("server.key"),
        cert: fs.readFileSync("server.cert"),
    };

    // Start Express with HTTPS
    https.createServer(options, app).listen(port, () => {
        logger.info(`[Development] HTTPS Server running at https://localhost:${port}`);
    });
} else {
    //Start Express with HTTP
    app.listen(port, () => {
        logger.info(`[Production] HTTP Server Statrted`);
    });
}

module.exports = app;