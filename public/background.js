console.log("[Youtube Summary Extension] connected...");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension 설치 완료");
  console.log("github 연결");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message);
});
