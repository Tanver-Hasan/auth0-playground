require('dotenv').config()
const express = require("express");
const session = require('express-session');
const port = process.env.PORT || 3000;
const jwt = require('jsonwebtoken');
const path = require('path');
const helmet = require('helmet');
const { check,validationResult } = require('express-validator');
const app = express();
const crypto = require('crypto');

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
                formAction: ["'self'", "https://login.tanverhasan.com"]
            }
        }
    })
);


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

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.get('/progressive-profiling', (req, res) => {
    const { state, session_token } = req.query;
    console.log(" Auth0 State Param " + state);
    console.log("Session Token " + session_token);

    if (state) {
        req.session.state = state;
    }


    try {
        const decoded = jwt.verify(session_token, process.env.SESSION_SECRET, {
            issuer: 'login.tanverhasan.com',
            algorithms: 'HS256'
        });
        console.log(decoded);
        req.session.tokenContent = decoded;

    } catch (err) {
        return res.status(400).send('Invalid session token');
    }

    res.render("ProgressiveProfilingPage", { nonce: res.locals.nonce })
})

// app.post('/progressive-profiling', (req, res) => {
//     const { firstName, lastName } = req.body;
//     req.session.firstName = firstName;
//     req.session.lastName = lastName;

//     const state = req.session.state || '';

//     var session_token = jwt.sign({ first_name: firstName, last_name:lastName }, 'secret');


//     console.log("Parsed State Param before redirection " + state);
//     if (!state) {
//         res.send("Something went wrong ");
//     }
//     const redirectUlr = `https://login.tanverhasan.com/continue?state=${state}`;
//     res.redirect(302, redirectUlr);

// })

app.post('/progressive-profiling',
    [check('firstName').trim().escape(),
    check('lastName').trim().escape()],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { firstName, lastName } = req.body;

        const state = req.session.state || '';
        const origin = req.protocol + '://' + req.get('host');

        // Generate a token that includes first and last name and state
        const session_token = jwt.sign(
            { sub: req.session.tokenContent.sub, iss: origin, first_name: firstName, last_name: lastName, state: state },
            process.env.SESSION_SECRET, {
            algorithm: 'HS256',
            expiresIn: '1m'
        }
        );

        console.log("Signred JWT token " + session_token);

        if (!session_token) {
            return res.send("Something went wrong");
        }
        const continueURL = req.session.tokenContent.continue_uri;

        // Instead of redirecting via GET, we respond with an HTML page that auto-submits a POST request.
        const continueUrl = `${continueURL}?state=${state}`;
        //const continueUrl = `https://login.tanverhasan.com/continue`;
        const htmlForm = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Redirecting...</title>
        <script nonce="${res.locals.nonce}">
          window.onload = function() {
            document.forms[0].submit();
          };
        </script>
      </head>
      <body>
        <form method="POST" action="${continueUrl}">
          <input type="hidden" name="state" value="${state}" />
          <input type="hidden" name="session_token" value="${session_token}" />
          <noscript>
            <button type="submit">Continue</button>
          </noscript>
        </form>
      </body>
    </html>
  `;
        res.send(htmlForm);
    });



app.listen(port, () => {
    console.log(`Server Listening On http://localhost:${port}`);
})
