// manifest.json >  "permissions": ["storage", "activeTab", "scripting", "tabs"]

let preHref = "";
let isDarkMode = false;
let videoId = "";
let userLang = "";
let apiCall = false;
let isLoad = false;

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
      videoId = window.location.search.split("?v=")[1];
      await insertSummary();
    }

    const observer = new MutationObserver((mutationList) => {
      mutationList.forEach(async (mutation) => {
        if (preHref !== document.location.href) {
          preHref = document.location.href;
          isLoad = false;
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

    if (apiCall && !isLoad) {
      waitForElm("#yt-script-container").then(async () => {
        const container = document.getElementById("yt-script-container");
        container.innerHTML = "";
        const loader = document.createElement("div");
        loader.className = "loader";
        container.append(loader);
        // container.innerText = transcript;
        userLang = document.documentElement.attributes["lang"].value;

        try {
          const languageCode = await getLanguageCode();
          chrome.runtime.sendMessage(
            {
              api: `http://49.50.160.55:1032/?videoId=${videoId}&inLang=${languageCode}&outLang=${userLang}`,
            },
            async (res) => {
              const { data } = res;
              isLoad = true;
              if (data[0].text === "transcript failed") {
                document.getElementById("yt-script-bar-icon").style.cssText =
                  "border: 2px solid red; color: red";
                document.getElementById("yt-script-bar-btn").click();
              }
              const sections = await getSections(data);
              // loader.style.display = "none";
              container.removeChild(loader);
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
          );

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

          // const sections = await getSections(data);
          // // loader.style.display = "none";
          // // container.removeChild(loader);
          // // chrome.runtime.sendMessage(sections);
          // sections.map((section) => {
          //   container.appendChild(section);
          //   const hr = document.createElement("hr");
          //   container.appendChild(hr);
          // });

          // // 전체 영상을 %단위로 쪼갠 데이터
          // // const playerBarInfo = [10, 20, 10, 30, 10, 20];
          // // 예제 영상 길이 = 13:18
          // // https://www.youtube.com/watch?v=tvI18HF3aaM
          // const playerBarInfo = getPlayerBarInfo(
          //   data,
          //   document.querySelector("video").duration
          // );
          // await insertPlayerBar(playerBarInfo);
        } catch (err) {
          chrome.runtime.sendMessage({ msg: err });
        }
      });
    }
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

  // !! 유튜브 기존 재생바 제거
  // while (container.childNodes[0]) {
  //   container.removeChild(container.childNodes[0]);
  // }
  // !!

  (await playerBars).reverse().forEach((playerBar) => {
    container.insertBefore(playerBar, container.childNodes[0]);
  });
}

function makeSummaryContainer() {
  const downArrowIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="1.5em" viewBox="0 0 512 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>`;
  const cancelIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="1.5em" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>`;
  const ytSummaryContainer = document.createElement("div");
  ytSummaryContainer.id = "yt-summary-extension-container";

  const ytScriptBar = document.createElement("div");
  ytScriptBar.id = "yt-script-bar";

  const ytScriptBarBtn = document.createElement("button");
  ytScriptBarBtn.id = "yt-script-bar-btn";
  ytScriptBarBtn.innerHTML = downArrowIcon;

  // bar button 클릭 이벤트
  ytScriptBarBtn.addEventListener("click", () => {
    apiCall = !apiCall;
    if (apiCall) {
      insertSummary();
      document.getElementById("yt-script-container").style.display = "block";
      ytScriptBarBtn.innerHTML = cancelIcon;
    } else {
      document.getElementById("yt-script-container").style.display = "none";
      ytScriptBarBtn.innerHTML = downArrowIcon;
    }
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
  });

  ytScriptBarIcon.addEventListener("mouseout", () => {
    ytSCriptBarIconTooltip.style.visibility = "hidden";
  });
  //

  const ytScriptContainer = document.createElement("div");
  ytScriptContainer.id = "yt-script-container";

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
  let data = await (await fetch(window.location.href)).text();
  data = data
    .split('"captions":')[1]
    .split(',"videoDetails')[0]
    .replace("\n", "");
  data = JSON.parse(data);
  return data["playerCaptionsTracklistRenderer"].captionTracks[0].languageCode;
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
