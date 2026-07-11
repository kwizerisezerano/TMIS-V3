const { ERROR_RESPONSES, SUCCESS_RESPONSES, getCurrentUTCDate } = require('../utils/common');
const { decryptUserData } = require('../utils/encryption');

class SurplusController {
  constructor(db) {
    this.db = db;
  }

  // Member: get own surplus
  async getMySurplus(req, res) {
    try {
      const userId = req.user?.userId || null;
      const tontineId = req.query.tontineId ? parseInt(req.query.tontineId) : null;

      if (!userId) return res.status(401).json(ERROR_RESPONSES.validation('Unauthorized'));

      let where = 'WHERE s.user_id = ?';
      const params = [userId];
      if (tontineId) { where += ' AND s.tontine_id = ?'; params.push(tontineId); }

      const [rows] = await this.db.execute(`
        SELECT s.*, t.name as tontine_name
        FROM surplus s
        JOIN tontines t ON s.tontine_id = t.id
        ${where}
        ORDER BY s.created_at DESC
      `, params);

      return res.json(SUCCESS_RESPONSES.ok(rows));
    } catch (err) {
      console.error('getMySurplus error:', err);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch surplus'));
    }
  }

  // Member: allocate surplus (grant privilege)
  async allocateSurplus(req, res) {
    try {
      const userId = req.user?.userId || null;
      if (!userId) return res.status(401).json(ERROR_RESPONSES.validation('Unauthorized'));
      const { surplusId } = req.params;
      const { destination, destination_id, member_note } = req.body;

      if (!destination || !['contribution', 'loan', 'penalty'].includes(destination)) {
        return res.status(400).json(ERROR_RESPONSES.validation('Valid destination is required (contribution, loan, penalty)'));
      }

      const [rows] = await this.db.execute(
        'SELECT * FROM surplus WHERE id = ? AND user_id = ? AND status = ?',
        [surplusId, userId, 'pending']
      );

      if (rows.length === 0) {
        return res.status(404).json(ERROR_RESPONSES.notFound('Surplus not found or already allocated'));
      }

      const parsedDestId = destination_id ? parseInt(destination_id) : null;
      if (parsedDestId) {
        if (isNaN(parsedDestId)) {
          return res.status(400).json(ERROR_RESPONSES.validation('destination_id must be a valid number'));
        }
        const tableMap = { contribution: 'contributions', loan: 'loans', penalty: 'penalties' };
        const [[destRow]] = await this.db.execute(
          `SELECT id FROM ${tableMap[destination]} WHERE id = ?`, [parsedDestId]
        );
        if (!destRow) {
          return res.status(400).json(ERROR_RESPONSES.validation(`${destination} #${parsedDestId} does not exist`));
        }
      }

      await this.db.execute(
        `UPDATE surplus SET destination = ?, destination_id = ?, member_note = ?, status = 'allocated', allocated_at = ? WHERE id = ?`,
        [destination, parsedDestId, member_note || null, getCurrentUTCDate(), surplusId]
      );

      return res.json(SUCCESS_RESPONSES.ok(null, 'Surplus allocated successfully'));
    } catch (err) {
      console.error('allocateSurplus error:', err);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to allocate surplus'));
    }
  }

  // Accountant/Admin: get all surplus for a tontine
  async getTontineSurplus(req, res) {
    try {
      const tontineId = parseInt(req.params.tontineId);
      const status = req.query.status || null;

      let where = 'WHERE s.tontine_id = ?';
      const params = [tontineId];
      if (status) { where += ' AND s.status = ?'; params.push(status); }

      const [rows] = await this.db.execute(`
        SELECT s.*, u.names as user_name, t.name as tontine_name
        FROM surplus s
        JOIN users u ON s.user_id = u.id
        JOIN tontines t ON s.tontine_id = t.id
        ${where}
        ORDER BY s.created_at DESC
      `, params);

      const decrypted = rows.map(r => {
        try {
          return { ...r, user_name: decryptUserData({ names: r.user_name }).names };
        } catch { return r; }
      });

      return res.json(SUCCESS_RESPONSES.ok(decrypted));
    } catch (err) {
      console.error('getTontineSurplus error:', err);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch surplus'));
    }
  }

  // Mark surplus as used (called internally after accountant records)
  async markSurplusUsed(db, surplusId) {
    await db.execute(
      `UPDATE surplus SET status = 'used' WHERE id = ?`,
      [surplusId]
    );
  }
}

module.exports = SurplusController;
