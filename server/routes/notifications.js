const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

// Procurement notifications are resolved by the request's own status, not the
// contract's. A request that has moved past the stage the alert was about (or is
// finished/cancelled) counts as done.
const isProcurementNotificationDone = (notification, request) => {
  if (!request) {
    return false;
  }

  const status = request.status;
  if (status === 'fulfilled' || status === 'cancelled') {
    return true;
  }

  const text = `${notification.title} ${notification.message} ${notification.actionLabel || ''}`.toLowerCase();

  // Purchasing: "prepare the budget request" is done once a quote was submitted.
  if (text.includes('new ') && text.includes('procurement request')) {
    return status !== 'requested' && status !== 'rejected';
  }

  // Accounting: budget approval is done once accounting has decided.
  if (text.includes('budget approval needed') || text.includes('review budget')) {
    return status !== 'awaiting_accounting_approval';
  }

  // Purchasing: an approved budget is acted on once proof has been submitted.
  if (text.includes('budget request approved') || text.includes('record purchase proof')) {
    return status !== 'approved';
  }

  // Purchasing: a returned request is done once it has been re-quoted/resubmitted.
  if (text.includes('needs revision') || text.includes('revise report') || text.includes('update proof')) {
    return status !== 'rejected' && status !== 'proof_needs_revision';
  }

  // Accounting: expense confirmation is done once the proof has been reviewed.
  if (text.includes('expense confirmation needed') || text.includes('confirm expense')) {
    return status !== 'proof_submitted';
  }

  // Informational status updates for the requesting department.
  if (text.includes('budget request submitted')) {
    return status !== 'awaiting_accounting_approval';
  }
  if (text.includes('proof of purchase submitted')) {
    return status !== 'proof_submitted';
  }

  return false;
};

// Contract-backed notifications resolve against the contract's own state.
const isContractNotificationDone = (notification, contract) => {
  if (!contract || !contract.status) {
    return false;
  }

  const status = contract.status;
  if (status === 'completed' || status === 'cancelled') {
    return true;
  }

  const text = `${notification.title} ${notification.message} ${notification.actionLabel || ''}`.toLowerCase();
  const approved = status === 'approved';

  if (text.includes('approve') || text.includes('ready for accounting') || text.includes('review payment')
    || text.includes('collection milestone') || text.includes('full payment received')) {
    return approved;
  }

  if (text.includes('client signature') || text.includes('waiting for client signature') || text.includes('mark client signed')) {
    return Boolean(contract.clientSigned) && status !== 'pending_client_signature' && status !== 'draft';
  }

  if (text.includes('collection') || text.includes('balance') || text.includes('payment follow') || text.includes('reservation fee')) {
    return contract.paymentStatus === 'paid';
  }

  if (text.includes('on hold') || text.includes('hold')) {
    return !contract.paymentHold?.active;
  }

  if (notification.department && contract.departmentProgress) {
    const progress = contract.departmentProgress[notification.department];
    if (typeof progress === 'number') {
      return progress >= 100;
    }
  }

  return false;
};

// Get user notifications, each tagged with whether its action is already resolved
// so the UI can show a green "Done" instead of a red "High".
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('contract', 'contractNumber clientName status eventDate clientSigned paymentStatus departmentProgress paymentHold')
      .populate('procurementRequest', 'requestNumber status department accounting fulfillment')
      .sort({ createdAt: -1 })
      .limit(50);

    const enriched = notifications.map((notification) => {
      const plain = notification.toObject();
      plain.actionDone = plain.procurementRequest
        ? isProcurementNotificationDone(plain, plain.procurementRequest)
        : isContractNotificationDone(plain, plain.contract);
      return plain;
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unread count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Dismiss (remove) a single notification for the current user.
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification dismissed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create notification (internal use)
router.post('/', auth, async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
