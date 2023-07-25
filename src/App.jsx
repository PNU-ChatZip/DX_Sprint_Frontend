import { useEffect, useState } from "react";
import GoogleIcon from "./assets/googleIcon/1x/btn_google_signin_light_normal_web.png";
import "./App.css";

export default function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [userData, setUserData] = useState({});

  const getUserData = async () => {
    await chrome.runtime.sendMessage({ storage: "token" }, (res) => {
      if (res.data.token) {
        setIsLogin(true);
        chrome.runtime.sendMessage({ storage: "userData" }, (res) => {
          setUserData(res.data.userData);
        });
        chrome.runtime.sendMessage({ setScript: true });
      }
    });
  };

  const logout = () => {
    chrome.runtime.sendMessage({ setScript: false });
    chrome.runtime.sendMessage({ logout: true });
    setIsLogin(false);
    setUserData({});
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <div className="App">
      <div id="title">YouTube Comprehension</div>
      {isLogin ? (
        <>
          <div id="profile">
            <div id="profileName">
              <img id="profileImg" src={userData.picture} />
              <span>{userData.email}</span>
            </div>
            <button onClick={logout}>로그아웃</button>
          </div>
          <div className="card">Free (적용 중)</div>
          [남은 api 호출 횟수 : {userData.apiAttempt}]
          <button
            onClick={() => {
              chrome.runtime.sendMessage({ reload: true }, (res) => {
                getUserData();
              });
            }}>
            새로고침
          </button>
        </>
      ) : (
        <button
          id="loginBtn"
          onClick={() => {
            chrome.runtime.sendMessage({ login: true }, (res) => {
              if (res.data.login) {
                getUserData();
              }
            });
          }}>
          <img src={GoogleIcon} />
        </button>
      )}
    </div>
  );
}

// export default function App() {
//   return (
//     <div class="App">
//       <div>YouTube Comprehension</div>
//     </div>
//   );
// }
