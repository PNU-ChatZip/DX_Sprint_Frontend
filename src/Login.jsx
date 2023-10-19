import GoogleIcon from "./assets/googleIcon/1x/btn_google_signin_light_normal_web.png";

export default function Login({ getUserData }) {
  return (
    <>
      <button
        id="loginBtn"
        onClick={() => {
          chrome.runtime.sendMessage({ googleLogin: true }, (res) => {
            if (res.login) getUserData();
          });
        }}>
        <img src={GoogleIcon} />
      </button>
    </>
  );
}
