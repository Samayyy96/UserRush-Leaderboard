import { useState } from "react";

export default function SubmitGame() {
  const [rollNo, setRollNo] = useState("");
  const [gameLink, setGameLink] = useState("");

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        "https://gameforge-leaderboard.onrender.com/submit-project",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ rollNo, gameLink })
        }
      );

      const data = await response.json();
      console.log(data);

      alert("Submitted");
      setRollNo("");
      setGameLink("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Submit Your Game</h1>

      <input
        className="border p-2 block mb-3"
        placeholder="Roll Number"
        value={rollNo}
        onChange={(e) => setRollNo(e.target.value)}
      />

      <input
        className="border p-2 block mb-3"
        placeholder="Game Link"
        value={gameLink}
        onChange={(e) => setGameLink(e.target.value)}
      />

      <button
        className="bg-blue-500 text-white px-4 py-2"
        onClick={handleSubmit}
      >
        Submit
      </button>
    </div>
  );
}