import { useState } from "react";

export default function Join({ setIsJoin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const onSubmit = () => {
    alert("회원가입 완료");
    setIsJoin(false);
  };

  return (
    <>
      <div>
        <div>
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </div>
        <div>
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </div>
        <div>
          <label htmlFor="password2">비밀번호 재입력</label>
          <input
            type="password"
            name="password2"
            value={password2}
            onChange={(e) => {
              setPassword2(e.target.value);
            }}
          />
        </div>
        <div>
          <button onClick={onSubmit}>회원가입</button>
        </div>
      </div>
      <button
        onClick={() => {
          setIsJoin(false);
        }}>
        돌아가기
      </button>
    </>
  );
}
