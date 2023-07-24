import { useState } from "react";
import "./App.css";

// export default function App() {
//   const [isLogin, setIsLogin] = useState(false);
//   const [userData, setUserData] = useState({});
//   return (
//     <div class="App">
//       <div>YouTube Comprehension</div>
//       {isLogin ? (
//         <>
//           <img src={userData.picture} /> | {userData.email}
//         </>
//       ) : (
//         <button
//           onClick={() => {
//             chrome.runtime.sendMessage({ login: true }, (res) => {
//               if (res.data.login) {
//                 setIsLogin(true);
//                 setUserData(res.data);
//               }
//             });
//           }}>
//           구글 로그인
//         </button>
//       )}
//     </div>
//   );
// }

export default function App() {
  return (
    <div class="App">
      <div>YouTube Comprehension</div>
    </div>
  );
}
