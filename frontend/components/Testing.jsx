import React, { useState } from "react";
import axios from "axios";

const HubspotOperationsForm = () => {
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

  const [createdIds, setCreatedIds] = useState({
    buyerContactId: "",
    sellerContactId: "",
    buyerCompanyId: "",
    sellerCompanyId: "",
  });

  const [meeting, setMeeting] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
  });

  const [deal, setDeal] = useState({
    dealName: "",
    amount: "",
    dealStage: "",
    pipeline: "default",
    closeDate: "",
  });

  const [task, setTask] = useState({
    subject: "",
    body: "",
    dueDate: "",
  });

  const [note, setNote] = useState({
    title: "",
    body: "",
  });

  const [email, setEmail] = useState({
    subject: "",
    body: "",
  });

  const [result, setResult] = useState(null);

  const createObject = async (endpoint, data) => {
    try {
      const res = await axios.post(
        `http://localhost:3000/integrations/hubspot/${endpoint}`,
        data
      );
      return res.data;
    } catch (error) {
      console.error(
        `Error creating ${endpoint}:`,
        error.response?.data || error.message
      );
      return null;
    }
  };
  const dealStageOptions = [
    "appointmentscheduled",
    "qualifiedtobuy",
    "presentationscheduled",
    "decisionmakerboughtin",
    "contractsent",
    "closedwon",
    "closedlost",
  ];
  const handleCreateContactsAndCompanies = async (e) => {
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
      setResult({
        type: "Contacts/Companies",
        error: "Error creating one or more objects.",
      });
      return;
    }

    setCreatedIds({
      buyerContactId: buyerContactResponse.id,
      sellerContactId: sellerContactResponse.id,
      buyerCompanyId: buyerCompanyResponse.id,
      sellerCompanyId: sellerCompanyResponse.id,
    });
    setResult({
      type: "Contacts/Companies",
      data: "Created successfully",
      ids: {
        buyerContact: buyerContactResponse.id,
        sellerContact: sellerContactResponse.id,
        buyerCompany: buyerCompanyResponse.id,
        sellerCompany: sellerCompanyResponse.id,
      },
    });
  };

  const handleDealSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...deal,
      contactId: createdIds.buyerContactId,
      companyId: createdIds.buyerCompanyId,
    };
    try {
      const res = await axios.post(
        "http://localhost:3000/integrations/hubspot/create-deal",
        payload
      );
      setResult({ type: "Deal", data: res.data });
    } catch (error) {
      setResult({ type: "Deal", error: error.response?.data || error.message });
    }
  };
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      inputs: [
        {
          properties: {
            hs_task_subject: task.subject,
            hs_task_body: task.body,
            hs_task_due_date: new Date(task.dueDate).getTime().toString(),
          },
        },
      ],
    };
    try {
      const res = await axios.post(
        "http://localhost:3000/integrations/hubspot/batch/create-tasks",
        payload
      );
      setResult({ type: "Task", data: res.data });
    } catch (error) {
      setResult({ type: "Task", error: error.response?.data || error.message });
    }
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      inputs: [
        {
          properties: {
            hs_note_body: note.title
              ? `${note.title}\n\n${note.body}`
              : note.body,
          },
        },
      ],
    };
    try {
      const res = await axios.post(
        "http://localhost:3000/integrations/hubspot/batch/create-note",
        payload
      );
      setResult({ type: "Note", data: res.data });
    } catch (error) {
      setResult({ type: "Note", error: error.response?.data || error.message });
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      inputs: [
        {
          properties: {
            hs_email_subject: email.subject,
            hs_email_body: email.body,
          },
        },
      ],
    };
    try {
      const res = await axios.post(
        "http://localhost:3000/integrations/hubspot/batch/create-emails",
        payload
      );
      setResult({ type: "Email", data: res.data });
    } catch (error) {
      setResult({
        type: "Email",
        error: error.response?.data || error.message,
      });
    }
  };

  const handleMeetingSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: meeting.title,
      description: meeting.description,
      startTime: new Date(meeting.startTime).getTime(),
      endTime: new Date(meeting.endTime).getTime(),
      buyerContactId: createdIds.buyerContactId,
      sellerContactId: createdIds.sellerContactId,
      buyerCompanyId: createdIds.buyerCompanyId,
      sellerCompanyId: createdIds.sellerCompanyId,
    };
    try {
      const res = await axios.post(
        "http://localhost:3000/integrations/hubspot/store-meeting",
        payload
      );
      setResult({ type: "Meeting", data: res.data });
    } catch (error) {
      setResult({
        type: "Meeting",
        error: error.response?.data || error.message,
      });
    }
  };
  return (
    <div>
      <h2>HubSpot Operations</h2>

      <div
        style={{ border: "1px solid black", padding: "10px", margin: "10px" }}
      >
        <h3>Create Contacts & Companies</h3>
        <h4>Buyer Contact</h4>
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
        <h4>Seller Contact</h4>
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
        <h4>Buyer Company</h4>
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
        <h4>Seller Company</h4>
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
        <button onClick={handleCreateContactsAndCompanies}>
          Create Contacts & Companies
        </button>
      </div>

      <div
        style={{ border: "1px solid black", padding: "10px", margin: "10px" }}
      >
        <h3>Create Meeting</h3>
        <input
          type="text"
          placeholder="Meeting Title"
          value={meeting.title}
          onChange={(e) => setMeeting({ ...meeting, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Meeting Body / Description"
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
        <button onClick={handleMeetingSubmit}>Create Meeting</button>
      </div>
      <div
        style={{ border: "1px solid black", padding: "10px", margin: "10px" }}
      >
        <h3>Create Deal</h3>
        <input
          type="text"
          placeholder="Deal Name"
          value={deal.dealName}
          onChange={(e) => setDeal({ ...deal, dealName: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Amount"
          value={deal.amount}
          onChange={(e) => setDeal({ ...deal, amount: e.target.value })}
          required
        />
        <select
          value={deal.dealStage}
          onChange={(e) => setDeal({ ...deal, dealStage: e.target.value })}
          required
        >
          <option value="">Select Deal Stage</option>
          {dealStageOptions.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Pipeline (default is 'default')"
          value={deal.pipeline}
          onChange={(e) => setDeal({ ...deal, pipeline: e.target.value })}
          required
        />

        <input
          type="datetime-local"
          placeholder="Close Date"
          value={deal.closeDate}
          onChange={(e) => setDeal({ ...deal, closeDate: e.target.value })}
          required
        />
        <button onClick={handleDealSubmit}>Create Deal</button>
      </div>
      <div
        style={{ border: "1px solid black", padding: "10px", margin: "10px" }}
      >
        <h3>Create Task</h3>
        <input
          type="text"
          placeholder="Task Subject"
          value={task.subject}
          onChange={(e) => setTask({ ...task, subject: e.target.value })}
          required
        />
        <textarea
          placeholder="Task Body"
          value={task.body}
          onChange={(e) => setTask({ ...task, body: e.target.value })}
          required
        />
        <input
          type="datetime-local"
          placeholder="Due Date"
          value={task.dueDate}
          onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
          required
        />
        <button onClick={handleTaskSubmit}>Create Task</button>
      </div>

      <div
        style={{ border: "1px solid black", padding: "10px", margin: "10px" }}
      >
        <h3>Create Note</h3>
        <input
          type="text"
          placeholder="Note Title"
          value={note.title}
          onChange={(e) => setNote({ ...note, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Note Body"
          value={note.body}
          onChange={(e) => setNote({ ...note, body: e.target.value })}
          required
        />
        <button onClick={handleNoteSubmit}>Create Note</button>
      </div>

      <div
        style={{ border: "1px solid black", padding: "10px", margin: "10px" }}
      >
        <h3>Create Email</h3>
        <input
          type="text"
          placeholder="Email Subject"
          value={email.subject}
          onChange={(e) => setEmail({ ...email, subject: e.target.value })}
          required
        />
        <textarea
          placeholder="Email Body"
          value={email.body}
          onChange={(e) => setEmail({ ...email, body: e.target.value })}
          required
        />
        <button onClick={handleEmailSubmit}>Create Email</button>
      </div>

      {result && (
        <div
          style={{ margin: "10px", padding: "10px", border: "1px solid gray" }}
        >
          <h3>Response ({result.type}):</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default HubspotOperationsForm;
