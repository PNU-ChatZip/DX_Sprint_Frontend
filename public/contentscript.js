let preHref = "";
let isDarkMode = false;

window.onload = async () => {
  if (window.location.hostname === "www.youtube.com") {
    // check dark mode
    isDarkMode = Boolean(document.querySelector("html").attributes.dark);
    chrome.runtime.sendMessage(isDarkMode);

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
          await insertSummary();
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
};

async function insertSummary() {
  // document.querySelector(
  //   "#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-timed-markers-container"
  // ).style.backgroundColor = "blue";
  // chrome.runtime.sendMessage({ isChange: true });
  if (window.location.search !== "" && window.location.search.includes("v=")) {
    const transcript = await getTranscript();
    // 자막 넣을 스크립트 공간 생성
    if (!document.getElementById("yt-summary-extension-container")) {
      const ytSummaryContainer = makeSummaryContainer();

      /*
       * @TODO: mutation을 통한 secondary-inner의 생성 확인
       */
      const secondaryInner = document.getElementById("secondary-inner");
      secondaryInner.insertBefore(
        ytSummaryContainer,
        secondaryInner.childNodes[0]
      );
    }

    const container = document.getElementById("yt-script-container");
    // container.innerText = transcript;

    const sections = await getSections();
    sections.map((section) => {
      container.appendChild(section);
      const hr = document.createElement("hr");
      container.appendChild(hr);
    });

    // 전체 영상을 %단위로 쪼갠 데이터
    const playerBarInfo = [10, 20, 10, 30, 10, 20];
    await insertPlayerBar(playerBarInfo);
  }
}

async function makePlayerBar(playerBarInfo) {
  const bars = [];
  playerBarInfo.map((info) => {
    const bar = document.createElement("div");
    bar.className =
      "ytp-chapter-hover-container ytp-exp-chapter-hover-container ytp-chapter-bar";
    bar.style.width = `${info}%`;
    bars.push(bar);
  });
  return bars;
}

async function insertPlayerBar(playerBarInfo) {
  const playerBars = makePlayerBar(playerBarInfo);
  const container = document.querySelector(".ytp-chapters-container");
  (await playerBars).reverse().forEach((playerBar) => {
    container.insertBefore(playerBar, container.childNodes[0]);
  });
}

function makeSummaryContainer() {
  const ytSummaryContainer = document.createElement("div");
  ytSummaryContainer.id = "yt-summary-extension-container";

  const ytScriptBar = document.createElement("div");
  ytScriptBar.id = "yt-script-bar";

  const ytScriptBarBtn = document.createElement("button");
  ytScriptBarBtn.id = "yt-script-bar-btn";
  ytScriptBarBtn.textContent = "X";

  const ytScriptContainer = document.createElement("div");
  ytScriptContainer.id = "yt-script-container";

  ytScriptBar.appendChild(ytScriptBarBtn);
  ytSummaryContainer.appendChild(ytScriptBar);
  ytSummaryContainer.appendChild(ytScriptContainer);

  return ytSummaryContainer;
}

async function getSections() {
  const sections = [];
  for (let i = 0; i < 10; i++) {
    const section = document.createElement("section");
    section.innerText = `section ${i}\n\n\n\n\n\n\n`;
    sections.push(section);
  }
  return sections;
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
  chrome.runtime.sendMessage({ rawTranscript, transcriptWithTimeStamp });
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
  fetch(
    "https://waterboom.iptime.org:1032/?videoId=" +
      window.location.search.split("?v=")[1]
  )
    .then((response) => response.json())
    .then((json) => chrome.runtime.sendMessage(json))
    .catch((e) => chrome.runtime.sendMessage({ err: e }));

  return transcriptWithTimeStamp;
}
