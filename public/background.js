// console.log("[Youtube Summary Extension] connected...");

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
    fetch("http://49.50.160.55:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: message.login.email,
        password: message.login.password,
        username: message.login.username,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.login) sendResponse({ login: true });
        else sendResponse({ login: false });
      })
      .catch((err) => console.log(err));
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
