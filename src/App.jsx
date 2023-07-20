import { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  return (
    <>
      <div>YouTube Comprehension</div>
    </>
  );
}

// export default function App() {
//   const [isLogin, setIsLogin] = useState(false);
//   const [userData, setUserData] = useState({});
//   const [email, setEmail] = useState();
//   const [password, setPassword] = useState();
//   const [username, setUsername] = useState();

//   useEffect(() => {
//     chrome.runtime.sendMessage(
//       {
//         storage: "username",
//       },
//       function (res) {
//         chrome.runtime.sendMessage(res);
//         if (res.username) {
//           chrome.runtime.sendMessage({ msg: "useEffect" });
//           setUserData({ username: res.username });
//           setIsLogin(true);
//         } else {
//           chrome.runtime.sendMessage(res);
//         }
//       }
//     );
//   }, []);

//   return (
//     <div className="App">
//       {isLogin ? (
//         <div>{userData.username}</div>
//       ) : (
//         <>
//           <form
//             onSubmit={async (e) => {
//               e.preventDefault();
//               chrome.runtime.sendMessage({ msg: "fetch start" });
//               chrome.runtime.sendMessage(
//                 {
//                   login: {
//                     email,
//                     password,
//                     username,
//                   },
//                 },
//                 (res) => {
//                   if (res.login) {
//                     setUserData({ email, username });
//                     setIsLogin(true);
//                   }
//                 }
//               );
//               chrome.runtime.sendMessage({ login: true });
//             }}>
//             <div>
//               <label>Email</label>
//               <input
//                 onChange={(e) => {
//                   setEmail(e.target.value);
//                 }}
//               />
//             </div>
//             <div>
//               <label>password</label>
//               <input
//                 onChange={(e) => {
//                   setPassword(e.target.value);
//                 }}
//               />
//             </div>
//             <div>
//               <label>username</label>
//               <input
//                 onChange={(e) => {
//                   setUsername(e.target.value);
//                 }}
//               />
//             </div>
//             <input type="submit" value="로그인" />
//           </form>
//           {email} {password} {username}
//         </>
//       )}
//     </div>
//   );
// }
