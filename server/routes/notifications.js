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

const POST_EVENT_SECTION_BY_DEPARTMENT = {
  creative: 'creativeAssets',
  linen: 'linenRequirements',
  stockroom: 'equipmentChecklist'
};

// Departments whose draft-stage task is to validate their own inventory section.
// The sectionConfirmations key matches the department name.
const INVENTORY_DEPARTMENTS = ['creative', 'linen', 'stockroom'];

// Contract-backed notifications resolve against the contract's own state.
const isContractNotificationDone = (notification, contract) => {
  if (!contract || !contract.status) {
    return false;
  }

  const status = contract.status;
  if (status === 'completed' || status === 'cancelled') {
    return true;
  }

  const approved = status === 'approved';
  const fullyPaid = contract.paymentStatus === 'paid';

  // Resolution is decided by notification type before any keyword matching.
  // The keyword rules read actionLabel too, and the compliance sweep stamps the
  // same generic "Review payment" label on every alert it sends (including
  // post-event checks), which would otherwise match the approval rule below and
  // mark unrelated tasks done.

  // Collection-timeline alerts are resolved by the balance being settled.
  if (['payment_followup', 'payment_milestone_due', 'payment_uncollectible', 'final_balance_due'].includes(notification.type)) {
    return fullyPaid;
  }

  // A hold is resolved only when the hold itself is lifted.
  if (notification.type === 'contract_on_hold') {
    return !contract.paymentHold?.active;
  }

  // Operational tasks are resolved by the assigned department finishing its own
  // work. The approval or deadline that created them can never complete them.
  const isOperationalTask = ['contract_approved', 'deadline_reminder', 'task_assigned'].includes(notification.type);

  const text = `${notification.title} ${notification.message} ${notification.actionLabel || ''}`.toLowerCase();

  if (!isOperationalTask) {
    if (text.includes('approve') || text.includes('ready for accounting') || text.includes('review payment')
      || text.includes('collection milestone') || text.includes('full payment received')) {
      return approved;
    }

    if (text.includes('client signature') || text.includes('waiting for client signature') || text.includes('mark client signed')) {
      return Boolean(contract.clientSigned) && status !== 'pending_client_signature' && status !== 'draft';
    }

    if (text.includes('collection') || text.includes('balance') || text.includes('payment follow') || text.includes('reservation fee')) {
      return fullyPaid;
    }

    if (text.includes('on hold') || text.includes('hold')) {
      return !contract.paymentHold?.active;
    }
  }

  // Transport lead-time reminders resolve as soon as transport is booked. Booking
  // a truck only lifts logistics progress to 50, so the progress fallback below
  // would keep this red even after the task is done.
  if (text.includes('transport not booked')) {
    return Boolean(contract.logisticsAssignment?.truck)
      || Boolean(contract.staffTransport?.vehicles?.length);
  }

  // Post-event check reminders resolve against the recipient department's own
  // items. departmentProgress tracks pre-event preparation, so it says nothing
  // about whether the returned items have actually been inspected.
  if (text.includes('post-event checks')) {
    const section = POST_EVENT_SECTION_BY_DEPARTMENT[notification.department];
    if (section) {
      const items = contract[section] || [];
      return items.length > 0 && items.every((item) => (
        item.postEventStatus === 'checked_ok' || item.postEventStatus === 'incident_reported'
      ));
    }
    return false;
  }

  // Draft-stage inventory validation: an inventory department's task is done the
  // moment it confirms its own section. departmentProgress tracks later item
  // preparation, so it never reflects this validation step (this was the reported
  // bug — Creative validated but the tag stayed red). Also resolves once the
  // contract moves past draft, since the validation window has then closed.
  if (INVENTORY_DEPARTMENTS.includes(notification.department)
    && (text.includes('validation needed') || text.includes('validate inventory') || text.includes('inventory changed'))) {
    return Boolean(contract.sectionConfirmations?.[notification.department]?.confirmed)
      || status !== 'draft';
  }

  // Draft-stage Sales prompts (confirm the payment term, react to a department's
  // validation) resolve once the payment arrangement is confirmed or the contract
  // has been sent onward past draft.
  if (notification.department === 'sales'
    && (text.includes('payment term') || text.includes('payment arrangement')
      || text.includes('validation complete') || text.includes('confirmed for'))) {
    return Boolean(contract.sectionConfirmations?.payments?.confirmed)
      || status !== 'draft';
  }

  // "Ready to close" is done only when the contract is actually closed. Accounting
  // progress reaches 100 at approval — long before closing — so the progress
  // fallback below would mark this done far too early.
  if (text.includes('ready to close') || text.includes('awaiting close') || text.includes('close contract')) {
    return status === 'completed';
  }

  // The initial "approved event ready for logistics" task is done once the cargo
  // truck is assigned. Requiring full dispatch (progress 100) would keep it red
  // through most of the event's life.
  if (notification.department === 'logistics' && notification.type === 'contract_approved') {
    return Boolean(contract.logisticsAssignment?.truck);
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
      // Only the postEventStatus of each checklist item is selected: the full
      // item documents carry inline image data URIs and would bloat the payload.
      // logisticsAssignment.truck and staffTransport.vehicles let the transport
      // lead-time reminder resolve once transport is booked.
      .populate('contract', 'contractNumber clientName status eventDate clientSigned paymentStatus departmentProgress paymentHold sectionConfirmations logisticsAssignment.truck staffTransport.vehicles creativeAssets.postEventStatus linenRequirements.postEventStatus equipmentChecklist.postEventStatus')
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
// Exported for the resolver test harness (test/notificationDone.test.js).
module.exports.isContractNotificationDone = isContractNotificationDone;
module.exports.isProcurementNotificationDone = isProcurementNotificationDone;
