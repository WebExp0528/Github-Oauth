import React, { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import Callback from "./pages/Callback";
import "./App.scss";

function App() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem("ACCESS_TOKEN") ?? "");

  const handleSaveToken = (token: string) => {
    setAccessToken(token);
    localStorage.setItem("ACCESS_TOKEN", token);
  };

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home accessToken={accessToken} setAccessToken={handleSaveToken} />} />
        <Route path="sign-in" element={<SignIn accessToken={accessToken} setAccessToken={handleSaveToken} />} />
        <Route path="callback" element={<Callback setAccessToken={handleSaveToken} />} />
      </Routes>
    </div>
  );
}

export default App;
