import React from "react";
import HubspotLogin from "../components/HubspotLogin";
import {Routes, Route} from "react-router-dom";
import MeetingAndAssociationsForm from "../components/MeetingAndAssociationsForm";

function App() {
  return (
    <div className="App">
       <Routes>
        <Route path="/" element={<HubspotLogin />} />
        <Route path="/meet-create" element={<MeetingAndAssociationsForm/>} />

    </Routes>
    </div>
  );
}

export default App;
