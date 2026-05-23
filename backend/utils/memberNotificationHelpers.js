const { getCurrentUTCDate } = require('./common');
const { decryptUserData } = require('./encryption');
const { calculateNewMemberEntryFee } = require('./theFutureConfig');
const { sendNewMemberEmail, sendNewMemberAdminNotification } = require('./email');

const decryptSafely = (user) => {
  if (!user) {
    return user;
  }

  try {
    return decryptUserData(user);
  } catch (error) {
    return user;
  }
};

const getEntryFeeCalculation = async (db, tontineId) => {
  const [totalContributions] = await db.execute(
    'SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE tontine_id = ? AND payment_status = ?',
    [tontineId, 'Approved']
  );

  const accumulatedShares = parseFloat(totalContributions[0]?.total || 0) || 0;
  return calculateNewMemberEntryFee(accumulatedShares);
};

const getAdminRecipients = async (db, excludeUserId = null) => {
  const params = ['admin', 'president'];
  let query = 'SELECT id, names, email FROM users WHERE role IN (?, ?)';

  if (excludeUserId) {
    query += ' AND id != ?';
    params.push(excludeUserId);
  }

  const [adminUsers] = await db.execute(query, params);
  return adminUsers.map(decryptSafely);
};

const notifyMemberAddedToTontine = async (db, { userId, tontineId }) => {
  const [members] = await db.execute(
    'SELECT id, names, email FROM users WHERE id = ?',
    [userId]
  );
  const [tontines] = await db.execute(
    'SELECT id, name FROM tontines WHERE id = ?',
    [tontineId]
  );

  if (members.length === 0 || tontines.length === 0) {
    return { entryFee: null };
  }

  const member = decryptSafely(members[0]);
  const tontine = tontines[0];
  const entryFeeCalculation = await getEntryFeeCalculation(db, tontineId);
  const adminRecipients = await getAdminRecipients(db, userId);

  const entryFeeNote = entryFeeCalculation.entryFee === 0
    ? ' (No accumulated contributions yet)'
    : '';
  const paymentNote = entryFeeCalculation.entryFee === 0
    ? ' You can start making your monthly contributions!'
    : ' Please contact the Executive Committee for payment details.';

  await db.execute(`
    INSERT INTO notifications (user_id, title, message, type, created_at)
    VALUES (?, ?, ?, ?, ?)
  `, [
    userId,
    'Joined Tontine',
    `You have successfully joined "${tontine.name}". Entry fee: RWF ${parseFloat(entryFeeCalculation.entryFee).toLocaleString()}${entryFeeNote}.${paymentNote}`,
    'success',
    getCurrentUTCDate()
  ]);

  for (const admin of adminRecipients) {
    await db.execute(`
      INSERT INTO notifications (user_id, title, message, type, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [
      admin.id,
      'New Member Joined',
      `${member.names} has joined "${tontine.name}". Entry fee due: RWF ${parseFloat(entryFeeCalculation.entryFee).toLocaleString()}${entryFeeNote}.`,
      'info',
      getCurrentUTCDate()
    ]);
  }

  try {
    if (member.email) {
      await sendNewMemberEmail(member.email, member, tontine, entryFeeCalculation);
    }

    for (const admin of adminRecipients) {
      if (admin.email) {
        await sendNewMemberAdminNotification(admin.email, member, tontine, entryFeeCalculation);
      }
    }
  } catch (error) {
    console.error('Member onboarding email notifications failed:', error.message);
  }

  return { entryFee: entryFeeCalculation };
};

module.exports = {
  notifyMemberAddedToTontine
};
