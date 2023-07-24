// manifest.json >  "permissions": ["identity"]
const downArrowIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="1.5em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>`;
const cancelIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="1.5em" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>`;
let preHref = "";
let isDarkMode = false;
let videoId = "";
let preVideoId = "";
let userLang = "";
let scriptOn = false;

window.onload = main;

async function main() {
  if (window.location.hostname === "www.youtube.com") {
    // check dark mode
    isDarkMode = Boolean(document.querySelector("html").attributes.dark);
    if (isDarkMode) {
      document.documentElement.style.setProperty("--color-black", "#0f0f0f");
      document.documentElement.style.setProperty("--color-white", "#fefefe");
    } else {
      document.documentElement.style.setProperty("--color-black", "#fefefe");
      document.documentElement.style.setProperty("--color-white", "#0f0f0f");
    }
    // chrome.runtime.sendMessage(isDarkMode);
    // chrome.runtime.sendMessage({ pageInfo: window.location.href });
    if (
      window.location.search !== "" &&
      window.location.search.includes("v=")
    ) {
      // chrome.runtime.sendMessage({ isPlaying: true });
      preHref = window.location.href;
      await insertSummary();
    }

    const observer = new MutationObserver((mutationList) => {
      mutationList.forEach(async (mutation) => {
        if (preHref !== document.location.href) {
          preHref = document.location.href;
          scriptOn = false;
          const container = document.querySelector(".ytp-chapters-container");
          if (container.childNodes[0].id === "custom-bar") {
            container.removeChild(container.childNodes[0]);
          }
          await insertSummary();
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
}

async function insertSummary() {
  if (window.location.search !== "" && window.location.search.includes("v=")) {
    if (!document.getElementById("yt-summary-extension-container")) {
      const ytSummaryContainer = makeSummaryContainer();
      waitForElm("#secondary-inner").then(() => {
        const secondaryInner = document.getElementById("secondary-inner");
        if (
          secondaryInner.childNodes[0].id !== "yt-summary-extension-container"
        )
          secondaryInner.insertBefore(
            ytSummaryContainer,
            secondaryInner.childNodes[0]
          );
      });
    }
  }

  if (scriptOn) await getSummaryApi();
  else {
    waitForElm("#yt-script-container").then((el) => {
      el.style.display = "none";
      document.getElementById("yt-script-bar-btn").innerHTML = downArrowIcon;
    });
  }
}

async function getSummaryApi() {
  waitForElm("#yt-script-container").then(async () => {
    const container = document.getElementById("yt-script-container");
    preVideoId = videoId;
    videoId = window.location.search.split("?v=")[1];
    if (preVideoId === videoId) {
      return;
    }
    container.innerHTML = "";
    const loader = document.createElement("div");
    loader.className = "loader";
    container.append(loader);
    // container.innerText = transcript;
    userLang = document.documentElement.attributes["lang"].value;

    try {
      chrome.runtime.sendMessage({ msg: "call api" });
      chrome.runtime.sendMessage({ msg: videoId });
      const languageCode = await getLanguageCode();
      if (languageCode === "no language code") {
        document.getElementById("yt-script-bar-icon").style.cssText =
          "border: 2px solid red; color: red";
        document.getElementById("yt-script-bar-btn").click();
        videoId = "";
        return;
      }
      chrome.runtime.sendMessage(
        {
          // api: `http://49.50.160.55:1032/test/?videoId=${videoId}&inLang=${languageCode}&outLang=${userLang}`,
          api: `http://49.50.160.55:1032/?videoId=${videoId}&inLang=${languageCode}&outLang=${userLang}`,
        },
        async (res) => {
          const { data } = res;
          isLoad = true;
          if (data[0].text === "transcript failed") {
            document.getElementById("yt-script-bar-icon").style.cssText =
              "border: 2px solid red; color: red";
            document.getElementById("yt-script-bar-btn").click();
          } else {
            const sections = await getSections(data);
            // loader.style.display = "none";
            waitForElm(".loader").then((el) => el.remove());
            // chrome.runtime.sendMessage(sections);
            sections.map((section) => {
              container.appendChild(section);
              const hr = document.createElement("hr");
              container.appendChild(hr);
            });

            // 전체 영상을 %단위로 쪼갠 데이터
            // const playerBarInfo = [10, 20, 10, 30, 10, 20];
            // 예제 영상 길이 = 13:18
            // https://www.youtube.com/watch?v=tvI18HF3aaM
            const playerBarInfo = getPlayerBarInfo(
              data,
              document.querySelector("video").duration
            );
            await insertPlayerBar(playerBarInfo);
          }
        }
      );
    } catch (err) {
      chrome.runtime.sendMessage({ msg: err });
    }
  });
}

// totalVideoPlaytime : second(초)
function getPlayerBarInfo(data, totalVideoPlaytime) {
  const playerBarInfo = [];
  let preInfo = 0;
  for (let i = 0; i < data.length; i++) {
    const timeData = data[i].time.split(":").map((t) => parseInt(t));
    nowInfo = ((timeData[0] * 60 + timeData[1]) / totalVideoPlaytime) * 100;
    playerBarInfo.push(nowInfo - preInfo);
    preInfo = nowInfo;
  }
  playerBarInfo.push(100 - preInfo);
  chrome.runtime.sendMessage(playerBarInfo);
  return playerBarInfo;
}

// async function makePlayerBar(playerBarInfo) {
//   const bars = [];
//   playerBarInfo.map((info) => {
//     const bar = document.createElement("div");
//     bar.className =
//       "ytp-chapter-hover-container ytp-exp-chapter-hover-container ytp-chapter-bar";
//     bar.style.width = `${info}%`;
//     bars.push(bar);
//   });
//   return bars;
// }

async function makePlayerBar(playerBarInfo) {
  const bars = [];
  playerBarInfo.map((info) => {
    const bar = document.createElement("div");
    // bar.className =
    //   "ytp-chapter-hover-container ytp-exp-chapter-hover-container ytp-chapter-bar";
    bar.style.width = `${info}%`;

    // const barPadding = document.createElement("div");
    // barPadding.className = "ytp-progress-bar-padding";
    // bar.appendChild(barPadding);
    // const ytpProgressBar = document.createElement("div");
    // ytpProgressBar.className = "ytp-progress-list";
    // const progressElementInfo = [
    //   {
    //     className: "ytp-play-progress ytp-swatch-background-color",
    //     style: "left: 0px; transform: scaleX(0);",
    //   },
    //   {
    //     className: "ytp-progress-linear-live-buffer",
    //     style: "left: 0px; transform: scaleX(0);",
    //   },
    //   {
    //     className: "ytp-hover-progress ytp-hover-progress-light",
    //     style: "left: 0px; transform: scaleX(0);",
    //   },
    //   { className: "ytp-ad-progress-list" },
    // ];
    // for (let i = 0; i < progressElementInfo.length; i++) {
    //   const el = document.createElement("div");
    //   el.className = progressElementInfo[i].className;
    //   el.style.cssText = progressElementInfo[i].style;
    //   ytpProgressBar.appendChild(el);
    // }
    // bar.appendChild(ytpProgressBar);
    bars.push(bar);
  });
  return bars;
}

async function insertPlayerBar(playerBarInfo) {
  const playerBars = makePlayerBar(playerBarInfo);
  const container = document.querySelector(".ytp-chapters-container");
  const customBar = document.createElement("div");
  customBar.id = "custom-bar";
  // !! 유튜브 기존 재생바 제거
  // while (container.childNodes[0]) {
  //   container.removeChild(container.childNodes[0]);
  // }
  // !!

  if (container.childNodes[0].id === "custom-bar") {
    container.removeChild(container.childNodes[0]);
  }

  (await playerBars).reverse().forEach((playerBar) => {
    customBar.insertBefore(playerBar, customBar.childNodes[0]);
  });
  container.insertBefore(customBar, container.childNodes[0]);
}

function makeSummaryContainer() {
  const ytSummaryContainer = document.createElement("div");
  ytSummaryContainer.id = "yt-summary-extension-container";

  const ytScriptBar = document.createElement("div");
  ytScriptBar.id = "yt-script-bar";

  const ytScriptBarBtn = document.createElement("button");
  ytScriptBarBtn.id = "yt-script-bar-btn";
  ytScriptBarBtn.innerHTML = downArrowIcon;

  // bar button 클릭 이벤트
  ytScriptBarBtn.addEventListener("click", () => {
    waitForElm("#yt-script-container").then((el) => {
      if (el.style.display === "block") {
        scriptOn = false;
        document.getElementById("yt-script-container").style.display = "none";
        ytScriptBarBtn.innerHTML = downArrowIcon;
      } else {
        scriptOn = true;
        document.getElementById("yt-script-container").style.display = "block";
        ytScriptBarBtn.innerHTML = cancelIcon;
        getSummaryApi();
      }
    });
  });
  //

  const ytScriptBarContent = document.createElement("span");
  ytScriptBarContent.textContent = "YouTube Comprehension";

  const ytScriptBarIcon = document.createElement("div");
  ytScriptBarIcon.id = "yt-script-bar-icon";
  ytScriptBarIcon.innerHTML = "i";

  const ytSCriptBarIconTooltip = document.createElement("div");
  ytSCriptBarIconTooltip.id = "yt-script-bar-icon-tooltip";
  ytSCriptBarIconTooltip.textContent =
    "자막 데이터가 없을 경우 요약이 불가능합니다.";
  ytScriptBarIcon.appendChild(ytSCriptBarIconTooltip);

  // icon 클릭 이벤트
  ytScriptBarIcon.addEventListener("mouseover", () => {
    ytSCriptBarIconTooltip.style.visibility = "visible";
    document.getElementById("yt-script-bar-icon").style.cssText =
      "border: 2px solid var(--color-white); var(--color-white)";
  });

  ytScriptBarIcon.addEventListener("mouseout", () => {
    ytSCriptBarIconTooltip.style.visibility = "hidden";
  });
  //

  const ytScriptContainer = document.createElement("div");
  ytScriptContainer.id = "yt-script-container";
  ytScriptContainer.style.display = "none";

  ytScriptBar.appendChild(ytScriptBarBtn);
  ytScriptBar.appendChild(ytScriptBarContent);
  ytScriptBar.appendChild(ytScriptBarIcon);
  ytSummaryContainer.appendChild(ytScriptBar);
  ytSummaryContainer.appendChild(ytScriptContainer);

  return ytSummaryContainer;
}

async function getSections(data) {
  const sections = [];
  chrome.runtime.sendMessage(data);
  for (let i = 0; i < data.length; i++) {
    const section = document.createElement("section");
    const videoMoveBtn = document.createElement("button");
    const sectionText = document.createElement("span");
    const timeData = data[i].time.split(":").map((t) => parseInt(t));
    const currentTime = timeData[0] * 60 + timeData[1];
    videoMoveBtn.className = "videoMoveBtn";
    videoMoveBtn.onclick = () => {
      document.querySelector("video").currentTime = currentTime;
    };
    videoMoveBtn.innerText = `${data[i].time}`;
    sectionText.textContent = `${data[i].text}`;
    section.appendChild(videoMoveBtn);
    section.appendChild(sectionText);
    sections.push(section);
  }
  return sections;
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
    return "no language code";
  }
}

async function getTranscript() {
  const videoPageHtml = await (await fetch(window.location.href)).text();
  const captionHtml = videoPageHtml.split('"captions":');

  if (captionHtml.length < 2) {
    return;
  }

  const captions_json = JSON.parse(
    captionHtml[1].split(',"videoDetails')[0].replace("\n", "")
  );
  const { captionTracks } = captions_json.playerCaptionsTracklistRenderer;
  const link = captionTracks[0].baseUrl;
  const transcript = await (await fetch(link)).text();

  const el = document.createElement("html");
  el.innerHTML = transcript;
  const textNodes = el.querySelectorAll("text");
  let rawTranscript = "";
  let transcriptWithTimeStamp = "";
  Array.from(textNodes).map((textNode) => {
    transcriptWithTimeStamp +=
      `[${textNode.getAttribute("start")}] ` + textNode.innerText;
    rawTranscript += textNode.innerText;
  });
  // chrome.runtime.sendMessage({ rawTranscript, transcriptWithTimeStamp });
  // const apiResult = await (
  //   await fetch("https://waterboom.iptime.org:1032", {
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     method: "POST",
  //     body: JSON.stringify({
  //       videoId: window.location.search.split("?v=")[1],
  //       transcript: transcriptWithTimeStamp,
  //     }),
  //   })
  // ).json();
  // chrome.runtime.sendMessage({ apiResult });
  // fetch(
  //   "https://waterboom.iptime.org:1032/?videoId=" +
  //     window.location.search.split("?v=")[1]
  // )
  //   .then((response) => response.json())
  //   .then((json) => chrome.runtime.sendMessage(json))
  //   .catch((e) => chrome.runtime.sendMessage({ err: e }));

  return transcriptWithTimeStamp;
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
