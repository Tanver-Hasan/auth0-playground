/**
* Handler that will be called during the execution of a PostLogin flow.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onExecutePostLogin = async (event, api) => {

  const token = api.redirect.encodeToken({
    secret: event.secrets.session_token_signing_key,
    expiresInSeconds: 60,
    payload: {
      email: event.user.email,
      continue_uri: `https://${event.request.hostname}/continue`
    }
  });
  api.redirect.sendUserTo("http://localhost:3000/progressive-profiling", {
    query: { session_token: token }
  });
}

/**
* Handler that will be invoked when this action is resuming after an external redirect. If your
* onExecutePostLogin function does not perform a redirect, this function can be safely ignored.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onContinuePostLogin = async (event, api) => {
  console.log("Returned to Auth0 ");
  console.log(event.request.body);

  const payload = api.redirect.validateToken({
    secret: event.secrets.session_token_signing_key,
    tokenParameterName: 'session_token',
  });
  console.log(payload);
  api.user.setUserMetadata("first_name", payload.first_name);
  api.user.setUserMetadata("last_name", payload.last_name);
}