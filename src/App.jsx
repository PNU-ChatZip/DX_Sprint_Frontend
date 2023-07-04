import "./App.css";

export default function App() {
  return (
    <div className="App">
      <button
        onClick={async () => {
          await fetch("https://192.168.10.227:8000/todos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: {
                rawTranscript: "popup page",
                transcriptWithTimeStamp: "text",
              },
            }),
          });
        }}>
        버튼
      </button>
    </div>
  );
}
