import React from "react";
import { Card } from "primereact/card";

export interface CallbackProps {
  setAccessToken: (token: string) => void;
}

const Callback = ({ setAccessToken }: CallbackProps) => {
  return (
    <div className="flex flex-row justify-content-center align-items-center" style={{ height: "100%" }}>
      <Card title="Authenticating"></Card>
    </div>
  );
};

export default Callback;
