import React from "react";
import HubspotLogin from "../components/HubspotLogin";
import {Routes, Route} from "react-router-dom";
import HubspotOperationsForm from "../components/Testing";

function App() {
  return (
    <div className="App">
       <Routes>
        <Route path="/" element={<HubspotLogin />} />
        <Route path="/meet-create" element={<HubspotOperationsForm/>} />

    </Routes>
    </div>
  );
}

export default App;
