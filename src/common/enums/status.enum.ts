export enum DepositStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum WithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

export enum InvestmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
}

export enum PlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum WalletStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

export enum StockStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}