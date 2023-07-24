// console.log("[Youtube Summary Extension] connected...");
let clientId =
  "766002842369-26jdfm69klqq8s3sv7gqkug1if20a7ei.apps.googleusercontent.com";
let redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;
let nonce = Math.random().toString(36).substring(2, 15);

const googleLogin = async (sendResponse) => {
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "id_token");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  // Add the OpenID scope. Scopes allow you to access the user’s information.
  authUrl.searchParams.set("scope", "openid profile email");
  authUrl.searchParams.set("nonce", nonce);
  // Show the consent screen after login.
  authUrl.searchParams.set("prompt", "consent");

  chrome.identity.launchWebAuthFlow(
    {
      url: authUrl.href,
      interactive: true,
    },
    (redirectUrl) => {
      if (redirectUrl) {
        // The ID token is in the URL hash
        const urlHash = redirectUrl.split("#")[1];
        const params = new URLSearchParams(urlHash);
        const jwt = params.get("id_token");

        // Parse the JSON Web Token
        const base64Url = jwt.split(".")[1];
        const base64 = base64Url.replace("-", "+").replace("_", "/");
        const token = JSON.parse(atob(base64));

        sendResponse({
          data: { login: true, email: token.email, picture: token.picture },
        });
        console.log("token", token);
      }
      sendResponse({ data: { login: false } });
    }
  );
  return true;
};

chrome.runtime.onInstalled.addListener(() => {
  // console.log("extension installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log(message);
  if (message.storage !== undefined) {
    chrome.storage.local.get(message.storage).then((data) => {
      // console.log(data.username);
      if (data.username) {
        sendResponse({ username: data.username });
      } else {
        sendResponse({ username: "" });
      }
    });
    return true;
  }

  if (message.login !== undefined) {
    googleLogin(sendResponse);
    return true;
  }

  if (message.api !== undefined) {
    fetch(message.api)
      .then((res) => res.json())
      .then((json) => sendResponse({ data: json }))
      .catch((err) => console.log(err));
    return true;
  }

  if (message.set !== undefined) {
    chrome.storage.local.set({ username: message.set });
    console.log(message.set);
    chrome.storage.local
      .get("username")
      .then((username) => console.log(username));
  }
});
