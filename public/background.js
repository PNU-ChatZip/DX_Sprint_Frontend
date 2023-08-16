class CustomError extends Error {
  constructor(code, ...params) {
    super(...params);
    this.code = code;
  }
}

// google login dataset
let clientId =
  "766002842369-26jdfm69klqq8s3sv7gqkug1if20a7ei.apps.googleusercontent.com";
let redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;
let nonce = Math.random().toString(36).substring(2, 15);

// api url
const API_BASE_URL = "http://49.50.160.55";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.clear();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request);

  if (request.storage !== undefined) {
    getInStorage(request.storage).then((result) => sendResponse(result));
    return true;
  }

  if (request.googleLogin !== undefined) {
    googleLogin().then((result) => sendResponse(result));
    return true;
  }

  if (request.logout !== undefined) {
    chrome.storage.local.clear();
    return;
  }

  if (request.api !== undefined) {
    getApi(request.api).then((result) => sendResponse(result));
    return true;
  }

  if (request.apiAttempt !== undefined) {
    getApiAttempt().then((result) => sendResponse(result));
    return true;
  }

  if (request.popup !== undefined) {
    popupOpen();
    return;
  }
});

async function getInStorage(key) {
  const data = await chrome.storage.local.get(key);
  const value = data[key];
  return { value };
}

async function setInStorage(object) {
  await chrome.storage.local.set(object);
  return;
}

async function googleLogin() {
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "id_token");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "openid profile email");
  authUrl.searchParams.set("nonce", nonce);
  authUrl.searchParams.set("prompt", "consent");

  const redirectUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.href,
    interactive: true,
  });

  if (redirectUrl) {
    // The ID token is in the URL hash
    const urlHash = redirectUrl.split("#")[1];
    const params = new URLSearchParams(urlHash);
    const jwt = params.get("id_token");

    // Parse the JSON Web Token
    const base64Url = jwt.split(".")[1];
    const base64 = base64Url.replace("-", "+").replace("_", "/");
    const googleLoginToken = JSON.parse(atob(base64));

    try {
      const json = await (
        await fetch(API_BASE_URL + "/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: googleLoginToken.email,
          }),
        })
      ).json();

      await setInStorage({
        token: json.token,
        userData: {
          picture: googleLoginToken.picture,
          email: googleLoginToken.email,
          apiAttempt: json.apiAttempt,
        },
      });

      return { login: true };
    } catch (err) {
      return { login: false };
    }
  }

  return { login: false };
}

async function getApi(videoData) {
  try {
    const { videoId, inLang, outLang } = videoData;
    const token = await (await getInStorage("token")).value;

    if (!token) throw new CustomError(401);

    const response = await fetch(
      API_BASE_URL +
        `/api/?videoId=${videoId}&inLang=${inLang}&outLang=${outLang}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    );

    if (!response.ok) {
      throw new CustomError(response.status);
    }

    const json = await response.json();

    return { code: 200, msg: "", data: json };
  } catch (err) {
    return errorData(err);
  }
}

async function getApiAttempt() {
  try {
    const token = (await getInStorage("token")).value;

    if (!token) throw new CustomError(401);

    const response = await fetch(API_BASE_URL + "/auth/apiAttempt", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!response.ok) {
      throw new CustomError(response.status);
    }

    const json = await response.json();
    const userData = (await getInStorage("userData")).value;
    userData.apiAttempt = json.apiAttempt;
    await setInStorage({ userData });

    return { code: 200, msg: "", data: json };
  } catch (err) {
    return errorData(err);
  }
}

function popupOpen() {
  chrome.windows.create({
    url: "index.html",
    type: "popup",
    width: 500,
    height: 600,
  });
}

function errorData(err) {
  let code = 500;
  let msg = "Unknown Error";
  if (err instanceof CustomError) {
    code = err.code;

    if (code === 401) msg = "Not Login";
    if (code === 403) msg = "No ApiAttempt";
  }

  return { code, msg, data: [] };
}
