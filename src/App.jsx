import { useEffect, useState } from "react";
import "./App.css";
import Home from "./Home";
import Login from "./Login";

export default function App() {
  const [isLogin, setIsLogin] = useState(false);
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
      {isLogin ? (
        <Home userData={userData} getUserData={getUserData} logout={logout} />
      ) : (
        <Login getUserData={getUserData} />
      )}
    </div>
  );
}
