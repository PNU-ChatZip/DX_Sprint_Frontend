// console.log("[Youtube Summary Extension] connected...");
let clientId =
  "766002842369-26jdfm69klqq8s3sv7gqkug1if20a7ei.apps.googleusercontent.com";
let redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;
let nonce = Math.random().toString(36).substring(2, 15);
let setScript = false;

const LOGIN_URL = "http://49.50.160.55:3000/auth/login";
const RELOAD_URL = "http://49.50.160.55:3000/auth/apiAttempt";
const API_URL = "http://49.50.160.55:1032";
// const LOGIN_URL = "http://waterboom.iptime.org:1034/auth/login";
// const RELOAD_URL = "http://waterboom.iptime.org:1034/auth/apiAttempt";
// const API_URL = "http://waterboom.iptime.org:1032";
// const LOGIN_URL = "http://localhost:3000/auth/login";
// const RELOAD_URL = "http://localhost:3000/auth/apiAttempt";

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
        const googleLoginToken = JSON.parse(atob(base64));

        fetch(LOGIN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: googleLoginToken.email,
          }),
        })
          .then((res) => res.json())
          .then((json) => {
            chrome.storage.local.set(
              {
                token: json.token,
                userData: {
                  picture: googleLoginToken.picture,
                  email: googleLoginToken.email,
                  apiAttempt: json.apiAttempt,
                },
              },
              (res) => {
                sendResponse({
                  data: {
                    login: true,
                  },
                });
              }
            );
          })
          .catch((err) => {
            // console.log(err);
            sendResponse({
              data: {
                login: false,
              },
            });
          });
        return true;
      }
      sendResponse({ data: { login: false } });
    }
  );
  return true;
};

chrome.runtime.onInstalled.addListener(() => {
  // console.log("extension installed");
  chrome.storage.local.clear();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log(message);
  if (message.reload !== undefined) {
    chrome.storage.local.get("token", (data) => {
      fetch(RELOAD_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: data.token,
        },
      })
        .then((res) => res.json())
        .then((json) => {
          chrome.storage.local.get("userData", (res) => {
            res.userData.apiAttempt = json.apiAttempt;
            chrome.storage.local.set({ userData: res.userData }, (r) => {
              sendResponse({ reload: true });
            });
          });
        });
    });
    return true;
  }

  if (message.storage !== undefined) {
    chrome.storage.local.get(message.storage, (data) => {
      if (!data) sendResponse({ data: "" });
      else sendResponse({ data });
    });
    return true;
  }

  if (message.login !== undefined) {
    googleLogin(sendResponse);
    return true;
  }

  if (message.logout !== undefined) {
    chrome.storage.local.clear();
  }

  if (message.api !== undefined) {
    if (setScript) {
      chrome.storage.local.get("token", (res) => {
        if (res.token) {
          fetch(API_URL + message.api, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: res.token,
            },
          })
            .then(async (response) => {
              if (!response.ok) {
                if (response.status === 401) throw new Error("not login");
                else if (response.status === 403)
                  throw new Error("not apiAttempt");
                else throw new Error("transcript failed"); // 406
              }
              return await response.json();
            })
            .then((json) => {
              sendResponse({ data: json });
            })
            .catch((err) => {
              sendResponse({ data: [{ text: err.message }] });
            });
        } else {
          sendResponse({ data: [{ text: "not login" }] });
        }
      });
    } else {
      sendResponse({ data: [{ text: "not login" }] });
    }

    return true;
  }

  if (message.setScript !== undefined) {
    setScript = message.setScript;
  }
});
