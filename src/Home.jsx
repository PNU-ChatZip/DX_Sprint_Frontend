export default function Home({ userData, getUserData, logout }) {
  return (
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
        onClick={async () => {
          await chrome.runtime.sendMessage({ apiAttempt: true });
          getUserData();
        }}>
        새로고침
      </button>
    </>
  );
}
