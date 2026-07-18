const { ERROR_RESPONSES, SUCCESS_RESPONSES } = require('../utils/common');
const { decryptUserData } = require('../utils/encryption');
const DatabaseHelpers = require('../utils/databaseHelpers');

class ReportsController {
  constructor(db) {
    this.db = new DatabaseHelpers(db);
  }

  _filters({ tontineId, days, targetUserId, alias = '' }) {
    const col = (c) => alias ? `${alias}.${c}` : c;
    const date    = days && days !== 'all' ? ` AND ${col('created_at')} >= DATE_SUB(NOW(), INTERVAL ${parseInt(days)} DAY)` : '';
    const tontine = tontineId   ? ` AND ${col('tontine_id')} = ${parseInt(tontineId)}` : '';
    const user    = targetUserId ? ` AND ${col('user_id')} = ${parseInt(targetUserId)}` : '';
    return { date, tontine, user };
  }

  async getSummary(req, res) {
    try {
      const { tontineId, days, userId } = req.query;
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'president';
      const targetUserId = isAdmin && !userId ? null : (userId || req.user?.userId);
      const f = this._filters({ tontineId, days, targetUserId });

      const [[contribSummary]] = await this.db.execute(`
        SELECT
          COALESCE(SUM(CASE WHEN payment_status = 'Approved' THEN amount ELSE 0 END), 0) AS total_approved,
          COALESCE(SUM(CASE WHEN payment_status = 'Pending'  THEN amount ELSE 0 END), 0) AS total_pending,
          COUNT(CASE WHEN payment_status = 'Approved' THEN 1 END) AS approved_count,
          COUNT(*) AS total_count
        FROM contributions WHERE 1=1${f.tontine}${f.user}${f.date}
      `);

      // Disbursed = everything that left Pending/Rejected (actually went through)
      const [[loanSummary]] = await this.db.execute(`
        SELECT
          COALESCE(SUM(CASE WHEN status NOT IN ('Pending','Rejected') THEN amount ELSE 0 END), 0) AS total_disbursed,
          COUNT(*) AS total_count,
          COUNT(CASE WHEN status IN ('Approved','Waiting','Received','Disbursed') THEN 1 END) AS active_count,
          COUNT(CASE WHEN status = 'Pending'   THEN 1 END) AS pending_count,
          COUNT(CASE WHEN status IN ('Repaid','Completed') THEN 1 END) AS paid_count,
          COUNT(CASE WHEN status = 'Defaulted' THEN 1 END) AS defaulted_count
        FROM loans WHERE 1=1${f.tontine}${f.user}${f.date}
      `);

      // Count ALL repayment statuses so nothing is hidden
      const [[repaymentSummary]] = await this.db.execute(`
        SELECT
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS total_repaid,
          COALESCE(SUM(amount), 0) AS total_all,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_count,
          COUNT(*) AS total_count
        FROM payments
        WHERE payment_type = 'loan_payment'${f.tontine}${f.user}${f.date}
      `);

      const [[penaltySummary]] = await this.db.execute(`
        SELECT
          COALESCE(SUM(amount), 0) AS total_amount,
          COUNT(*) AS total_count,
          COUNT(CASE WHEN status = 'paid'    THEN 1 END) AS paid_count,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count,
          COUNT(CASE WHEN status = 'waived'  THEN 1 END) AS waived_count,
          COALESCE(SUM(CASE WHEN status IN ('paid','waived') THEN amount ELSE 0 END), 0) AS paid_amount
        FROM penalties WHERE 1=1${f.tontine}${f.user}${f.date}
      `);

      let memberSummary = { total_members: 0, active_tontines: 0 };
      if (isAdmin && !targetUserId) {
        const [[ms]] = await this.db.execute(
          `SELECT COUNT(DISTINCT user_id) AS total_members FROM tontine_members WHERE status = 'approved'${f.tontine}`
        );
        const [[ts]] = await this.db.execute(
          `SELECT COUNT(*) AS active_tontines FROM tontines WHERE status = 'active'${tontineId ? ` AND id = ${parseInt(tontineId)}` : ''}`
        );
        memberSummary = { total_members: ms.total_members, active_tontines: ts.active_tontines };
      }

      const totalInflows  = parseFloat(contribSummary.total_approved) + parseFloat(repaymentSummary.total_repaid);
      const totalOutflows = parseFloat(loanSummary.total_disbursed);
      const netBalance    = totalInflows - totalOutflows;
      const repaymentRate = loanSummary.total_disbursed > 0
        ? Math.round((repaymentSummary.total_repaid / loanSummary.total_disbursed) * 100) : 0;

      return res.json(SUCCESS_RESPONSES.ok({
        contributions: {
          totalApproved: parseFloat(contribSummary.total_approved),
          totalPending:  parseFloat(contribSummary.total_pending),
          approvedCount: parseInt(contribSummary.approved_count),
          totalCount:    parseInt(contribSummary.total_count),
        },
        loans: {
          totalDisbursed:  parseFloat(loanSummary.total_disbursed),
          totalCount:      parseInt(loanSummary.total_count),
          activeCount:     parseInt(loanSummary.active_count),
          pendingCount:    parseInt(loanSummary.pending_count),
          paidCount:       parseInt(loanSummary.paid_count),
          defaultedCount:  parseInt(loanSummary.defaulted_count),
        },
        repayments: {
          totalRepaid:    parseFloat(repaymentSummary.total_repaid),
          totalAll:       parseFloat(repaymentSummary.total_all),
          completedCount: parseInt(repaymentSummary.completed_count),
          totalCount:     parseInt(repaymentSummary.total_count),
          repaymentRate,
        },
        penalties: {
          totalAmount:  parseFloat(penaltySummary.total_amount),
          totalCount:   parseInt(penaltySummary.total_count),
          paidCount:    parseInt(penaltySummary.paid_count),
          pendingCount: parseInt(penaltySummary.pending_count),
          waivedCount:  parseInt(penaltySummary.waived_count),
          paidAmount:   parseFloat(penaltySummary.paid_amount),
        },
        members: memberSummary,
        balance: { totalInflows, totalOutflows, netBalance },
      }));
    } catch (error) {
      console.error('Error fetching report summary:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch report summary'));
    }
  }

  async getTransactions(req, res) {
    try {
      const { tontineId, days, userId, type = 'contributions', page = 1, limit = 15 } = req.query;
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'president';
      const targetUserId = isAdmin && !userId ? null : (userId || req.user?.userId);

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const lim    = parseInt(limit);
      let data = [], total = 0;

      if (type === 'contributions') {
        const f = this._filters({ tontineId, days, targetUserId, alias: 'c' });
        const [[ct]] = await this.db.execute(
          `SELECT COUNT(*) AS total FROM contributions c WHERE 1=1${f.tontine}${f.user}${f.date}`
        );
        total = ct?.total || 0;
        [data] = await this.db.execute(`
          SELECT c.id, c.amount, c.payment_status AS status, c.payment_method,
                 c.contribution_date, c.created_at,
                 t.name AS tontine_name, u.names AS user_name
          FROM contributions c
          LEFT JOIN tontines t ON c.tontine_id = t.id
          JOIN users u ON c.user_id = u.id
          WHERE 1=1${f.tontine}${f.user}${f.date}
          ORDER BY c.created_at DESC LIMIT ? OFFSET ?
        `, [lim, offset]);

      } else if (type === 'loans') {
        const f = this._filters({ tontineId, days, targetUserId, alias: 'l' });
        const [[ct]] = await this.db.execute(
          `SELECT COUNT(*) AS total FROM loans l WHERE 1=1${f.tontine}${f.user}${f.date}`
        );
        total = ct?.total || 0;
        [data] = await this.db.execute(`
          SELECT l.id, l.amount, l.total_amount, l.interest_rate, l.status,
                 l.repayment_period, l.due_date, l.created_at,
                 t.name AS tontine_name, u.names AS user_name
          FROM loans l
          LEFT JOIN tontines t ON l.tontine_id = t.id
          JOIN users u ON l.user_id = u.id
          WHERE 1=1${f.tontine}${f.user}${f.date}
          ORDER BY l.created_at DESC LIMIT ? OFFSET ?
        `, [lim, offset]);

      } else if (type === 'repayments') {
        // Use LEFT JOIN on tontines because tontine_id can be NULL in payments
        const f = this._filters({ tontineId, days, targetUserId, alias: 'p' });
        const [[ct]] = await this.db.execute(
          `SELECT COUNT(*) AS total FROM payments p WHERE p.payment_type = 'loan_payment'${f.tontine}${f.user}${f.date}`
        );
        total = ct?.total || 0;
        [data] = await this.db.execute(`
          SELECT p.id, p.amount, p.status, p.payment_method, p.created_at,
                 t.name AS tontine_name, u.names AS user_name,
                 l.amount AS loan_amount, l.total_amount AS loan_total
          FROM payments p
          LEFT JOIN tontines t ON p.tontine_id = t.id
          JOIN users u ON p.user_id = u.id
          LEFT JOIN loans l ON p.loan_id = l.id
          WHERE p.payment_type = 'loan_payment'${f.tontine}${f.user}${f.date}
          ORDER BY p.created_at DESC LIMIT ? OFFSET ?
        `, [lim, offset]);

      } else if (type === 'penalties') {
        const f = this._filters({ tontineId, days, targetUserId, alias: 'pen' });
        const [[ct]] = await this.db.execute(
          `SELECT COUNT(*) AS total FROM penalties pen WHERE 1=1${f.tontine}${f.user}${f.date}`
        );
        total = ct?.total || 0;
        [data] = await this.db.execute(`
          SELECT pen.id, pen.amount, pen.status, pen.reason, pen.type AS penalty_type,
                 pen.created_at, pen.paid_at,
                 t.name AS tontine_name, u.names AS user_name
          FROM penalties pen
          LEFT JOIN tontines t ON pen.tontine_id = t.id
          JOIN users u ON pen.user_id = u.id
          WHERE 1=1${f.tontine}${f.user}${f.date}
          ORDER BY pen.created_at DESC LIMIT ? OFFSET ?
        `, [lim, offset]);
      }

      data = data.map(r => {
        try { r.user_name = decryptUserData({ names: r.user_name }).names; } catch (e) {}
        return r;
      });

      return res.json(SUCCESS_RESPONSES.ok({
        data,
        total,
        page:  parseInt(page),
        limit: lim,
        pages: Math.ceil(total / lim),
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json(ERROR_RESPONSES.server('Failed to fetch transactions'));
    }
  }
}

module.exports = ReportsController;
