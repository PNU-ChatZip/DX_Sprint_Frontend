const downArrowIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="1.5em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>`;
const cancelIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="1.5em" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>`;
let preHref = "";

class Script {
  static visible() {
    const scriptViewBody = document.getElementById("script-view-body");
    if (scriptViewBody.style.display === "block") return true;
    else return false;
  }

  static open() {
    const scriptViewBody = document.getElementById("script-view-body");
    scriptViewBody.style.display = "block";

    const scriptViewHeaderBtn = document.getElementById(
      "script-view-header-btn"
    );
    scriptViewHeaderBtn.innerHTML = cancelIcon;

    (async () => {
      if (await checkLogin()) {
        await insertSummary();
        return;
      }
      await chrome.runtime.sendMessage({ popup: true });
      this.close();
      return;
    })();
  }

  static close() {
    const scriptViewBody = document.getElementById("script-view-body");
    scriptViewBody.style.display = "none";

    const scriptViewHeaderBtn = document.getElementById(
      "script-view-header-btn"
    );
    scriptViewHeaderBtn.innerHTML = downArrowIcon;
  }
}

class InfoText {
  static setMsg(msg) {
    const scriptViewHeaderInfoIconText = document.getElementById(
      "script-view-header-info-icon-text"
    );
    scriptViewHeaderInfoIconText.textContent = msg;
  }

  static open() {
    const scriptViewHeaderInfoIconText = document.getElementById(
      "script-view-header-info-icon-text"
    );
    scriptViewHeaderInfoIconText.style.visibility = "visible";
  }

  static close() {
    const scriptViewHeaderInfoIconText = document.getElementById(
      "script-view-header-info-icon-text"
    );
    scriptViewHeaderInfoIconText.style.visibility = "hidden";
  }
}

window.onload = () => {
  main();
};

async function main() {
  if (window.location.hostname !== "www.youtube.com") return;
  await insertScriptView();

  const observer = new MutationObserver((mutationList) => {
    mutationList.forEach(async (mutation) => {
      if (preHref !== document.location.href) {
        await insertScriptView();
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

async function insertScriptView() {
  if (window.location.search !== "" && window.location.search.includes("v=")) {
    preHref = window.location.href;
  } else return;

  setDarkMode(Boolean(document.querySelector("html").attributes.dark));

  await erasePlayerBar();

  // 스크립트뷰가 존재한다면 종료
  if (document.getElementById("script-view")) {
    Script.close();
    return;
  }

  // 존재하지 않는다면 생성 후 삽입
  const scriptView = makeScriptView();
  const secondaryInner = await waitForElm("#secondary-inner");
  if (secondaryInner.childNodes[0].id !== "script-view") {
    secondaryInner.insertBefore(scriptView, secondaryInner.childNodes[0]);
  }
}

function makeScriptView() {
  const scriptView = document.createElement("div");
  scriptView.id = "script-view";

  const scriptViewHeader = document.createElement("div");
  scriptViewHeader.id = "script-view-header";

  const scriptViewHeaderBtn = document.createElement("button");
  scriptViewHeaderBtn.id = "script-view-header-btn";
  scriptViewHeaderBtn.innerHTML = downArrowIcon;
  scriptViewHeaderBtn.addEventListener("click", () => {
    if (Script.visible()) Script.close();
    else Script.open();
  });

  const scriptViewHeaderTitle = document.createElement("span");
  scriptViewHeaderTitle.id = "script-view-header-title";
  scriptViewHeaderTitle.textContent = "YouTube Comprehension";

  const scriptViewHeaderInfoIcon = document.createElement("div");
  scriptViewHeaderInfoIcon.id = "script-view-header-info-icon";
  scriptViewHeaderInfoIcon.innerHTML = "i";

  const scriptViewHeaderInfoIconText = document.createElement("div");
  scriptViewHeaderInfoIconText.id = "script-view-header-info-icon-text";
  scriptViewHeaderInfoIconText.textContent =
    "자막 데이터가 없을 경우 요약이 불가능합니다";
  scriptViewHeaderInfoIcon.appendChild(scriptViewHeaderInfoIconText);

  scriptViewHeaderInfoIcon.addEventListener("mouseover", () => {
    InfoText.open();
  });
  scriptViewHeaderInfoIcon.addEventListener("mouseout", () => {
    InfoText.close();
  });

  const scriptViewBody = document.createElement("div");
  scriptViewBody.id = "script-view-body";
  scriptViewBody.style.display = "none";

  scriptViewHeader.appendChild(scriptViewHeaderTitle);
  scriptViewHeader.appendChild(scriptViewHeaderInfoIcon);
  scriptViewHeader.appendChild(scriptViewHeaderBtn);
  scriptView.appendChild(scriptViewHeader);
  scriptView.appendChild(scriptViewBody);

  return scriptView;
}

function waitForElm(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

async function checkLogin() {
  const token = await chrome.runtime.sendMessage({ storage: "token" });
  if (token.value) return true;
  return false;
}

function errorHandler() {
  InfoText.setMsg("자막 데이터 로딩 실패");
}

async function insertSummary() {
  const scriptViewBody = await waitForElm("#script-view-body");
  scriptViewBody.innerHTML = "";

  const loaderContainer = document.createElement("div");
  loaderContainer.id = "loader-container";

  const loaderSpinner = document.createElement("div");
  loaderSpinner.className = "loader-spinner";

  for (let i = 0; i < 12; ++i) {
    const loaderSpinnerItem = document.createElement("div");
    loaderSpinnerItem.className = "loader-spinner-item";
    loaderSpinner.appendChild(loaderSpinnerItem);
  }

  const loaderComment = document.createElement("div");
  loaderComment.className = "loader-comment";

  const loaderCommentText = document.createElement("span");
  loaderCommentText.textContent = "Wating for 10s ~ 1m.";

  loaderComment.appendChild(loaderCommentText);
  loaderContainer.appendChild(loaderSpinner);
  loaderContainer.appendChild(loaderComment);

  scriptViewBody.append(loaderContainer);
  //

  const summary = await getSummary();
  if (summary.length !== 0) {
    await insertSections(summary);
    await insertPlayerBar(summary);
  } else {
    Script.close();
    errorHandler();
  }

  waitForElm("#loader-container").then((el) => el.remove());
}

async function getSummary() {
  try {
    const videoId = window.location.search.split("?v=")[1];
    const userLang = document.documentElement.attributes["lang"].value;
    const languageCode = await getLanguageCode();

    if (!languageCode) throw new Error();

    const response = await chrome.runtime.sendMessage({
      api: {
        videoId: videoId,
        inLang: languageCode,
        outLang: userLang,
      },
    });

    const { code, msg, data } = response;

    if (code === 200) {
      chrome.runtime.sendMessage({ data });
      return data;
    }
  } catch (err) {
    return [];
  }
}

async function getLanguageCode() {
  try {
    let data = await (await fetch(window.location.href)).text();
    data = data
      .split('"captions":')[1]
      .split(',"videoDetails')[0]
      .replace("\n", "");
    data = JSON.parse(data);
    return data["playerCaptionsTracklistRenderer"].captionTracks[0]
      .languageCode;
  } catch (err) {
    return "";
  }
}

async function insertSections(data) {
  const scriptViewBody = await waitForElm("#script-view-body");
  const sections = getSections(data);

  sections.map((section) => {
    scriptViewBody.appendChild(section);
    const hr = document.createElement("hr");
    scriptViewBody.appendChild(hr);
  });
}

function getSections(data) {
  const sections = [];

  for (let i = 0; i < data.length; i++) {
    const section = document.createElement("section");
    const videoLink = document.createElement("button");
    const sectionContent = document.createElement("span");
    const currentTime = StringToTime(data[i].time);
    videoLink.className = "videoLink";
    videoLink.onclick = () => {
      document.querySelector("video").currentTime = currentTime;
    };
    videoLink.innerText = `${data[i].time}`;
    sectionContent.textContent = `${data[i].text}`;
    section.appendChild(videoLink);
    section.appendChild(sectionContent);
    sections.push(section);
  }

  return sections;
}

async function insertPlayerBar(data) {
  const playerBar = getPlayerBar(data);
  const container = document.querySelector(".ytp-chapters-container");
  container.insertBefore(playerBar, container.childNodes[0]);
}

function getPlayerBar(data) {
  const playerBarInfo = [];
  const totalVideoTime = document.querySelector("video").duration;
  let preInfo = 0;

  for (let i = 0; i < data.length; i++) {
    const timeData = StringToTime(data[i].time);
    nowInfo = (timeData / totalVideoTime) * 100;
    playerBarInfo.push(nowInfo - preInfo);
    preInfo = nowInfo;
  }
  playerBarInfo.push(100 - preInfo);

  const bars = [];
  playerBarInfo.map((info) => {
    const bar = document.createElement("div");
    bar.style.width = `${info}%`;
    bars.push(bar);
  });

  const customBar = document.createElement("div");
  customBar.id = "custom-bar";

  bars.reverse().forEach((playerBar) => {
    customBar.insertBefore(playerBar, customBar.childNodes[0]);
  });

  return customBar;
}

async function erasePlayerBar() {
  const container = await waitForElm(".ytp-chapters-container");
  if (container.childNodes[0].id === "custom-bar") {
    container.removeChild(container.childNodes[0]);
  }
}

/**
 * 시간 테이블 형식의 데이터를 초 단위 데이터로 변환
 *
 * @param {String} timeString "hh:mm:ss" or "mm:ss"
 * @returns total seconds
 */
function StringToTime(timeString) {
  const part = Array.from(timeString.split(":"));
  return part
    .reverse()
    .map((time, index) => parseInt(time) * 60 ** index)
    .reduce((a, b) => a + b, 0);
}

function setDarkMode(isDarkMode) {
  if (isDarkMode) {
    document.documentElement.style.setProperty("--color-black", "#0f0f0f");
    document.documentElement.style.setProperty("--color-white", "#fefefe");
  } else {
    document.documentElement.style.setProperty("--color-black", "#fefefe");
    document.documentElement.style.setProperty("--color-white", "#0f0f0f");
  }
}
