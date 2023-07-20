let preHref = "";
let isDarkMode = false;
let videoId = "";

window.onload = main;

async function main() {
  if (window.location.hostname === "www.youtube.com") {
    // check dark mode
    isDarkMode = Boolean(document.querySelector("html").attributes.dark);
    // chrome.runtime.sendMessage(isDarkMode);
    // chrome.runtime.sendMessage({ pageInfo: window.location.href });
    if (
      window.location.search !== "" &&
      window.location.search.includes("v=")
    ) {
      // chrome.runtime.sendMessage({ isPlaying: true });
      preHref = window.location.href;
      videoId = window.location.search.split("?v=")[1];
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
}

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
      waitForElm("#secondary-inner").then(() => {
        const secondaryInner = document.getElementById("secondary-inner");
        secondaryInner.insertBefore(
          ytSummaryContainer,
          secondaryInner.childNodes[0]
        );
      });
      // const secondaryInner = document.getElementById("secondary-inner");
      // secondaryInner.insertBefore(
      //   ytSummaryContainer,
      //   secondaryInner.childNodes[0]
      // );
    }

    waitForElm("#yt-script-container").then(async () => {
      const container = document.getElementById("yt-script-container");
      // container.innerText = transcript;

      const data = await (
        await fetch("https://waterboom.iptime.org:1032/?videoId=2RU1_CXCPbw")
      ).json();

      // const data = [
      //   {
      //     time: "00:21",
      //     text: "자막에서 데드풀이라는 캐릭터를 언급하며 캐릭터의 디자인과 표현을 칭찬합니다",
      //   },
      //   {
      //     time: "02:47",
      //     text: "화자는 흥분을 표현하며 프로페셔널의 완벽한 작품이라고 칭찬합니다",
      //   },
      //   {
      //     time: "04:46",
      //     text: "화자는 세 번째 줄에서 모든 걱정이 사라지고 공연의 완벽함을 칭찬하며 보여준 실력에 놀라움과 감탄을 표현하고 있습니다",
      //   },
      //   {
      //     time: "07:19",
      //     text: "이 영상은 미술계에서 흔히 볼 수 없는 고미나와 이세돌의 팬아트를 등장시켜 독특하고 신선한 컨셉을 선보이고 있습니다",
      //   },
      //   {
      //     time: "09:30",
      //     text: "화자는 곧 출시될 작품에 대한 기대감을 표현하며, 가는 곳마다 불을 마주치는 코난과 비슷한 캐릭터가 등장할 것임을 암시합니다",
      //   },
      //   {
      //     time: "12:37",
      //     text: "말레피센트는 해커 대회에서 우승하며 뛰어난 실력을 칭찬받습니다",
      //   },
      // ];

      const sections = await getSections(data);
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
    });
  }
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
    bar.className =
      "ytp-chapter-hover-container ytp-exp-chapter-hover-container ytp-chapter-bar";
    bar.style.width = `${info}%`;

    const barPadding = document.createElement("div");
    barPadding.className = "ytp-progress-bar-padding";
    bar.appendChild(barPadding);
    const ytpProgressBar = document.createElement("div");
    ytpProgressBar.className = "ytp-progress-list";
    const progressElementInfo = [
      {
        className: "ytp-play-progress ytp-swatch-background-color",
        style: "left: 0px; transform: scaleX(0);",
      },
      {
        className: "ytp-progress-linear-live-buffer",
        style: "left: 0px; transform: scaleX(0);",
      },
      {
        className: "ytp-hover-progress ytp-hover-progress-light",
        style: "left: 0px; transform: scaleX(0);",
      },
      { className: "ytp-ad-progress-list" },
    ];
    for (let i = 0; i < progressElementInfo.length; i++) {
      const el = document.createElement("div");
      el.className = progressElementInfo[i].className;
      el.style.cssText = progressElementInfo[i].style;
      ytpProgressBar.appendChild(el);
    }
    bar.appendChild(ytpProgressBar);
    bars.push(bar);
  });
  return bars;
}

async function insertPlayerBar(playerBarInfo) {
  const playerBars = makePlayerBar(playerBarInfo);
  const container = document.querySelector(".ytp-chapters-container");

  // !! 유튜브 재생바 제거
  // while (container.childNodes[0]) {
  //   container.removeChild(container.childNodes[0]);
  // }
  // !!

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

  const ytScriptBarContent = document.createElement("span");
  ytScriptBarContent.textContent = "YOUTUBE SUMMARY";

  const ytScriptContainer = document.createElement("div");
  ytScriptContainer.id = "yt-script-container";

  ytScriptBar.appendChild(ytScriptBarBtn);
  ytScriptBar.appendChild(ytScriptBarContent);
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
    // section.innerHTML = `${data[i].time} | ${data[i].text}`;
    // section.innerHTML = `<a class="yt-core-attributed-string__link yt-core-attributed-string__link--display-type yt-core-attributed-string__link--call-to-action-color" tabindex="0" href="/watch?v=aD73tXB0vYA&t=${currentTime}s" rel="nofollow" target="" force-new-state="true">${data[i].time}</a> | ${data[i].text}`;
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
