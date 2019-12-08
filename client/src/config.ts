// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'of32vp5qtf'
export const apiEndpoint = `https://${apiId}.execute-api.eu-west-3.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'dev-todo0.auth0.com',            // Auth0 domain
  clientId: 'N1sCudiBQngj9uYhxkg05Pd0Y6PdRfza',          // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
