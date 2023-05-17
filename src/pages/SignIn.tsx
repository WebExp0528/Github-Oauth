import React, { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { githubOAuthApp } from "../utils/github";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import OauthPopup from "../components/OauthPopup";
import { axiosInstanceWithoutToken } from "../utils/axios";

interface SignInProps {
  accessToken: string;
  setAccessToken: (token: string) => void;
}

const SignIn = ({ accessToken, setAccessToken }: SignInProps) => {
  const navigate = useNavigate();
  const [isError, setError] = useState("");
  const toast = useRef<any>();

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    navigate("/");
  }, [accessToken]);

  const { url } = githubOAuthApp.getWebFlowAuthorizationUrl({
    allowSignup: true,
    redirectUrl: process.env.REACT_APP_GITHUB_CALLBACK_URI,
  });

  const handleCode = async (code: string) => {
    const response = await axiosInstanceWithoutToken.post("/api/login/oauth/access_token", {
      code,
      client_id: process.env.REACT_APP_GITHUB_CLIENT_ID!,
      client_secret: process.env.REACT_APP_GITHUB_SECRET_KEY!,
      redirect_uri: process.env.REACT_APP_GITHUB_CALLBACK_URI,
    });

    if (response?.data?.access_token) {
      setAccessToken(response?.data?.access_token);
    } else {
      setError(response?.data?.error);
    }
  };

  useEffect(() => {
    if (!isError) return;

    toast.current.show({ severity: "error", summary: "OAuth Failed", detail: isError });
  }, [isError]);

  const handleClose = () => {};

  const footer = (
    <span>
      <OauthPopup title="Github OAuth" url={url} onCode={handleCode} onClose={handleClose}>
        <Button>Github OAuth</Button>
      </OauthPopup>
    </span>
  );

  return (
    <div className="flex flex-row justify-content-center align-items-center" style={{ height: "100%" }}>
      <Toast ref={toast} />
      <Card footer={footer} title="Sign in"></Card>
    </div>
  );
};

export default SignIn;
