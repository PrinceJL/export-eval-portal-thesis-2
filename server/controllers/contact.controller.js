const { sql } = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Reuse multer logic from message.controller if possible, but for now duplicate to keep independent
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(process.cwd(), "uploads/");
        if (process.env.NODE_ENV !== "production" && !fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-contact-" + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for contact pics
}).single("picture");

async function getContacts(req, res) {
    try {
        const contacts = await sql.ContactInfo.findAll({
            where: { isVisible: true },
            order: [["createdAt", "ASC"]]
        });
        res.json(contacts);
    } catch (e) {
        console.error("getContacts error:", e);
        res.status(500).json({ error: "Failed to fetch contacts" });
    }
}

async function getAllContactsAdmin(req, res) {
    try {
        const contacts = await sql.ContactInfo.findAll({
            order: [["createdAt", "ASC"]]
        });
        res.json(contacts);
    } catch (e) {
        console.error("getAllContactsAdmin error:", e);
        res.status(500).json({ error: "Failed to fetch contacts" });
    }
}

async function createContact(req, res) {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });

        try {
            const { name, linkedinUrl, description, isVisible } = req.body;

            let pictureUrl = null;
            if (req.file) {
                pictureUrl = `/uploads/${req.file.filename}`;
            }

            const contact = await sql.ContactInfo.create({
                name,
                linkedinUrl,
                description,
                pictureUrl,
                isVisible: isVisible === 'true' || isVisible === true
            });

            res.status(201).json(contact);
        } catch (e) {
            console.error("createContact error:", e);
            res.status(500).json({ error: "Failed to create contact" });
        }
    });
}

async function updateContact(req, res) {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });

        try {
            const { id } = req.params;
            const { name, linkedinUrl, description, isVisible } = req.body;

            const contact = await sql.ContactInfo.findByPk(id);
            if (!contact) return res.status(404).json({ error: "Contact not found" });

            const updates = {};
            if (name !== undefined) updates.name = name;
            if (linkedinUrl !== undefined) updates.linkedinUrl = linkedinUrl;
            if (description !== undefined) updates.description = description;
            if (isVisible !== undefined) updates.isVisible = isVisible === 'true' || isVisible === true;

            if (req.file) {
                // Optionally delete old file here if needed
                updates.pictureUrl = `/uploads/${req.file.filename}`;
            }

            await contact.update(updates);
            res.json(contact);
        } catch (e) {
            console.error("updateContact error:", e);
            res.status(500).json({ error: "Failed to update contact" });
        }
    });
}

async function deleteContact(req, res) {
    try {
        const { id } = req.params;
        const contact = await sql.ContactInfo.findByPk(id);
        if (!contact) return res.status(404).json({ error: "Contact not found" });

        await contact.destroy();
        res.json({ message: "Contact deleted" });
    } catch (e) {
        console.error("deleteContact error:", e);
        res.status(500).json({ error: "Failed to delete contact" });
    }
}

module.exports = {
    getContacts,
    getAllContactsAdmin,
    createContact,
    updateContact,
    deleteContact
};
