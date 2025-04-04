import React, { useState } from "react";
import axios from "axios";

const MeetingAndAssociationsForm = () => {
  const [buyerContact, setBuyerContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [sellerContact, setSellerContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [buyerCompany, setBuyerCompany] = useState({
    name: "",
    domain: "",
    phone: "",
  });
  const [sellerCompany, setSellerCompany] = useState({
    name: "",
    domain: "",
    phone: "",
  });
  const [meeting, setMeeting] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
  });
  const [result, setResult] = useState(null);

  const toTimestamp = (datetime) => new Date(datetime).getTime();

  const createObject = async (url, data) => {
    try {
      const res = await axios.post(
        `http://localhost:3000/integrations/hubspot/${url}`,
        data
      );
      return res.data;
    } catch (error) {
      console.error(
        `Error creating ${url}:`,
        error.response?.data || error.message
      );
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const buyerContactResponse = await createObject(
      "create-contact",
      buyerContact
    );
    const sellerContactResponse = await createObject(
      "create-contact",
      sellerContact
    );
    const buyerCompanyResponse = await createObject(
      "create-company",
      buyerCompany
    );
    const sellerCompanyResponse = await createObject(
      "create-company",
      sellerCompany
    );

    if (
      !buyerContactResponse ||
      !sellerContactResponse ||
      !buyerCompanyResponse ||
      !sellerCompanyResponse
    ) {
      setResult("Error creating one or more objects.");
      return;
    }
    const buyerContactId = buyerContactResponse.id;
    const sellerContactId = sellerContactResponse.id;
    const buyerCompanyId = buyerCompanyResponse.id;
    const sellerCompanyId = sellerCompanyResponse.id;
    const meetingPayload = {
      title: meeting.title,
      description: meeting.description,
      startTime: toTimestamp(meeting.startTime),
      endTime: toTimestamp(meeting.endTime),
      buyerContactId,
      sellerContactId,
      buyerCompanyId,
      sellerCompanyId,
    };

    try {
      const meetingRes = await axios.post(
        "http://localhost:3000/integrations/hubspot/store-meeting",
        meetingPayload
      );
      setResult(meetingRes.data);
    } catch (error) {
      setResult(error.response?.data || error.message);
    }
  };

  return (
    <div>
      <h2>Create Buyer and Seller Data & Meeting</h2>
      <form onSubmit={handleSubmit}>
        <h3>Buyer Contact</h3>
        <input
          type="text"
          placeholder="First Name"
          value={buyerContact.firstName}
          onChange={(e) =>
            setBuyerContact({ ...buyerContact, firstName: e.target.value })
          }
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={buyerContact.lastName}
          onChange={(e) =>
            setBuyerContact({ ...buyerContact, lastName: e.target.value })
          }
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={buyerContact.email}
          onChange={(e) =>
            setBuyerContact({ ...buyerContact, email: e.target.value })
          }
          required
        />
        <input
          type="text"
          placeholder="Phone"
          value={buyerContact.phone}
          onChange={(e) =>
            setBuyerContact({ ...buyerContact, phone: e.target.value })
          }
        />

        <h3>Seller Contact</h3>
        <input
          type="text"
          placeholder="First Name"
          value={sellerContact.firstName}
          onChange={(e) =>
            setSellerContact({ ...sellerContact, firstName: e.target.value })
          }
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={sellerContact.lastName}
          onChange={(e) =>
            setSellerContact({ ...sellerContact, lastName: e.target.value })
          }
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={sellerContact.email}
          onChange={(e) =>
            setSellerContact({ ...sellerContact, email: e.target.value })
          }
          required
        />
        <input
          type="text"
          placeholder="Phone"
          value={sellerContact.phone}
          onChange={(e) =>
            setSellerContact({ ...sellerContact, phone: e.target.value })
          }
        />

        <h3>Buyer Company</h3>
        <input
          type="text"
          placeholder="Company Name"
          value={buyerCompany.name}
          onChange={(e) =>
            setBuyerCompany({ ...buyerCompany, name: e.target.value })
          }
          required
        />
        <input
          type="text"
          placeholder="Domain"
          value={buyerCompany.domain}
          onChange={(e) =>
            setBuyerCompany({ ...buyerCompany, domain: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Phone"
          value={buyerCompany.phone}
          onChange={(e) =>
            setBuyerCompany({ ...buyerCompany, phone: e.target.value })
          }
        />

        <h3>Seller Company</h3>
        <input
          type="text"
          placeholder="Company Name"
          value={sellerCompany.name}
          onChange={(e) =>
            setSellerCompany({ ...sellerCompany, name: e.target.value })
          }
          required
        />
        <input
          type="text"
          placeholder="Domain"
          value={sellerCompany.domain}
          onChange={(e) =>
            setSellerCompany({ ...sellerCompany, domain: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Phone"
          value={sellerCompany.phone}
          onChange={(e) =>
            setSellerCompany({ ...sellerCompany, phone: e.target.value })
          }
        />

        <h3>Meeting Details</h3>
        <input
          type="text"
          placeholder="Meeting Title"
          value={meeting.title}
          onChange={(e) => setMeeting({ ...meeting, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          value={meeting.description}
          onChange={(e) =>
            setMeeting({ ...meeting, description: e.target.value })
          }
          required
        />
        <input
          type="datetime-local"
          placeholder="Start Time"
          value={meeting.startTime}
          onChange={(e) =>
            setMeeting({ ...meeting, startTime: e.target.value })
          }
          required
        />
        <input
          type="datetime-local"
          placeholder="End Time"
          value={meeting.endTime}
          onChange={(e) => setMeeting({ ...meeting, endTime: e.target.value })}
          required
        />

        <button type="submit">Submit All Data</button>
      </form>
      {result && (
        <div>
          <h3>Response:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default MeetingAndAssociationsForm;
