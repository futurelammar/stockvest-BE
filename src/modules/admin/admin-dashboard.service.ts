import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Investment, InvestmentDocument } from '../investments/schemas/investment.schema';
import { InvestmentPlan, InvestmentPlanDocument } from '../investment-plans/schemas/investment-plan.schema';
import { Deposit, DepositDocument } from '../deposits/schemas/deposit.schema';
import { Withdrawal, WithdrawalDocument } from '../withdrawals/schemas/withdrawal.schema';
import { Role } from '../../common/enums/role.enum';
import { DepositStatus, WithdrawalStatus, InvestmentStatus, PlanStatus } from '../../common/enums/status.enum';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Investment.name) private investmentModel: Model<InvestmentDocument>,
    @InjectModel(InvestmentPlan.name) private planModel: Model<InvestmentPlanDocument>,
    @InjectModel(Deposit.name) private depositModel: Model<DepositDocument>,
    @InjectModel(Withdrawal.name) private withdrawalModel: Model<WithdrawalDocument>,
  ) {}

  async getOverview() {
    const [
      totalUsers,
      activeUsers,
      totalAdmins,
      totalPlans,
      activePlans,
      activeInvestments,
      completedInvestments,
      pendingDeposits,
      approvedDeposits,
      pendingWithdrawals,
      approvedWithdrawals,
      totalInvestedAgg,
      totalProfitPaidAgg,
      totalDepositedAgg,
      totalWithdrawnAgg,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: Role.USER }),
      this.userModel.countDocuments({ role: Role.USER, isActive: true }),
      this.userModel.countDocuments({ role: Role.ADMIN }),
      this.planModel.countDocuments(),
      this.planModel.countDocuments({ status: PlanStatus.ACTIVE }),
      this.investmentModel.countDocuments({ status: InvestmentStatus.ACTIVE }),
      this.investmentModel.countDocuments({ status: InvestmentStatus.COMPLETED }),
      this.depositModel.countDocuments({ status: DepositStatus.PENDING }),
      this.depositModel.countDocuments({ status: DepositStatus.APPROVED }),
      this.withdrawalModel.countDocuments({ status: WithdrawalStatus.PENDING }),
      this.withdrawalModel.countDocuments({
        status: { $in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID] },
      }),
      this.investmentModel.aggregate([
        { $group: { _id: null, total: { $sum: '$amountInvested' } } },
      ]),
      this.investmentModel.aggregate([
        { $match: { status: InvestmentStatus.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$expectedProfit' } } },
      ]),
      this.depositModel.aggregate([
        { $match: { status: DepositStatus.APPROVED } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.withdrawalModel.aggregate([
        { $match: { status: { $in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        admins: totalAdmins,
      },
      plans: {
        total: totalPlans,
        active: activePlans,
      },
      investments: {
        active: activeInvestments,
        completed: completedInvestments,
        totalInvested: totalInvestedAgg[0]?.total || 0,
        totalProfitPaid: totalProfitPaidAgg[0]?.total || 0,
      },
      deposits: {
        pending: pendingDeposits,
        approved: approvedDeposits,
        totalDeposited: totalDepositedAgg[0]?.total || 0,
      },
      withdrawals: {
        pending: pendingWithdrawals,
        approvedOrPaid: approvedWithdrawals,
        totalWithdrawn: totalWithdrawnAgg[0]?.total || 0,
      },
    };
  }

  async getRecentActivity(limit = 10) {
    const [recentDeposits, recentWithdrawals, recentInvestments, recentUsers] = await Promise.all([
      this.depositModel.find().sort({ createdAt: -1 }).limit(limit).populate('user', 'fullName email'),
      this.withdrawalModel.find().sort({ createdAt: -1 }).limit(limit).populate('user', 'fullName email'),
      this.investmentModel
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'fullName email')
        .populate('plan', 'planName'),
      this.userModel
        .find({ role: Role.USER })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('fullName email createdAt'),
    ]);

    return { recentDeposits, recentWithdrawals, recentInvestments, recentUsers };
  }
}