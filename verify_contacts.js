const axios = require("axios");

const verifyContacts = async () => {
    try {
        const baseUrl = "http://localhost:3000/api";
        console.log("Attempting to login as admin1...");
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            username: "admin1",
            password: "pass123",
            deviceFingerprint: "test-device"
        });

        const token = loginRes.data.accessToken;
        console.log("Login successful. Token obtained.");

        console.log("Fetching contacts...");
        const contactsRes = await axios.get(`${baseUrl}/messages/contacts`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Contacts Fetch Result (Status " + contactsRes.status + "):");
        console.log(JSON.stringify(contactsRes.data, null, 2));

        if (contactsRes.data.length === 0) {
            console.log("WARNING: Contacts list is empty.");
        } else {
            console.log("SUCCESS: Found " + contactsRes.data.length + " contacts.");
        }

    } catch (error) {
        console.error("Verification failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Message:", error.message);
        }
    }
};

verifyContacts();
