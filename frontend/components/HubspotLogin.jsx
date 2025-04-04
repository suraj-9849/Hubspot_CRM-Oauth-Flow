import React from "react";

const HubspotLogin = () => {
  const handleLogin = () => {
    window.location.href =
      "http://localhost:3000/integrations/hubspot/authorize";
  };

  return <button onClick={handleLogin}>Connect with Hubspot</button>;
};

export default HubspotLogin;
