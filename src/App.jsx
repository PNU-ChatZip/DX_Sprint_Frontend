import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [userData, setUserData] = useState({});
  const [token, setToken] = useState();

  const getUserData = async () => {
    await chrome.runtime.sendMessage({ storage: "token" }, (res) => {
      if (res.data.token) {
        setIsLogin(true);
        setToken(res.data.token);
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
    setToken(null);
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <div class="App">
      <div>YouTube Comprehension</div>
      {isLogin ? (
        <>
          <img src={userData.picture} /> | {userData.email}
          <div>token: {token}</div>
          <button
            onClick={() => {
              logout();
            }}>
            로그아웃
          </button>
        </>
      ) : (
        <button
          onClick={() => {
            chrome.runtime.sendMessage({ login: true }, (res) => {
              if (res.data.login) {
                getUserData();
              }
            });
          }}>
          구글 로그인
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
