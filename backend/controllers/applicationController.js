import Application from '../models/Application.js';

export const listApplications = async (req, res) => {
  try {
    const userId = req.user._id;
    const items = await Application.find({ userId }).sort({ updatedAt: -1 }).limit(200);
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch applications: ' + e.message });
  }
};

export const createApplication = async (req, res) => {
  try {
    const userId = req.user._id;
    const payload = { ...req.body, userId };
    const app = new Application(payload);
    await app.save();
    res.json({ message: 'Created', application: app });
  } catch (e) {
    res.status(400).json({ error: 'Failed to create application: ' + e.message });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const app = await Application.findOneAndUpdate({ _id: id, userId }, req.body, { new: true });
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Updated', application: app });
  } catch (e) {
    res.status(400).json({ error: 'Failed to update application: ' + e.message });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const app = await Application.findOneAndDelete({ _id: id, userId });
    if (!app) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(400).json({ error: 'Failed to delete application: ' + e.message });
  }
};
