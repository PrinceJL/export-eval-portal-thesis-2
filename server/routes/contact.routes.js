const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact.controller");
const authenticate = require("../middleware/auth.middleware");

// Public route to view contacts
router.get("/", contactController.getContacts);

// Protected routes (Admin/Researcher)
router.use(authenticate);

// Middleware to check if user is admin or researcher
const checkAdmin = (req, res, next) => {
    if (req.user.role === 'ADMIN' || req.user.role === 'RESEARCHER') {
        next();
    } else {
        res.status(403).json({ error: "Forbidden: Admins only" });
    }
};

router.get("/admin/all", checkAdmin, contactController.getAllContactsAdmin);
router.post("/", checkAdmin, contactController.createContact);
router.put("/:id", checkAdmin, contactController.updateContact);
router.delete("/:id", checkAdmin, contactController.deleteContact);

module.exports = router;
