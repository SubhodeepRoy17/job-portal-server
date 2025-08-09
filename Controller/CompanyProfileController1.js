const CompanyProfile = require("../Model/CompanyProfileModel");

exports.getCompanyProfile = async (req, res) => {
    try {
        const profile = await CompanyProfile.getCompanyProfile(req.user.id);
        if (!profile) {
            return res.status(404).json({ message: "Company profile not found" });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCompanyProfile = async (req, res) => {
    try {
        const profile = await CompanyProfile.createCompanyProfile({
            user_id: req.user.id,
            ...req.body
        });
        res.status(201).json(profile);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateCompanyProfile = async (req, res) => {
    try {
        const profile = await CompanyProfile.updateCompanyProfile(
            req.user.id,
            req.body
        );
        if (!profile) {
            return res.status(404).json({ message: "Company profile not found" });
        }
        res.json(profile);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};