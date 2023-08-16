import { useEffect, useState } from "react";
import "./App.css";
import Home from "./Home";
import Login from "./Login";
import Join from "./Join";

export default function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [isJoin, setIsJoin] = useState(false);
  const [userData, setUserData] = useState({});

  const getUserData = () => {
    chrome.runtime.sendMessage({ storage: "token" }, (token) => {
      chrome.runtime.sendMessage({ msg: token });
      if (token.value) {
        setIsLogin(true);
        chrome.runtime.sendMessage(
          {
            storage: "userData",
          },
          (res) => {
            setUserData(res.value);
          }
        );
      }
    });
  };

  const logout = () => {
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
      {isJoin ? (
        <>
          <Join setIsJoin={setIsJoin} />
        </>
      ) : (
        <>
          {isLogin ? (
            <Home
              userData={userData}
              getUserData={getUserData}
              logout={logout}
            />
          ) : (
            <Login getUserData={getUserData} setIsJoin={setIsJoin} />
          )}
        </>
      )}
    </div>
  );
}
