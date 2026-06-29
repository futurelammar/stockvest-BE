
export function welcomeTemplate(fullName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">Welcome, ${fullName} 👋</h2>
      <p>Your account has been created successfully. You can now log in and start exploring investment plans.</p>
      <p style="margin-top: 24px; color: #64748b; font-size: 13px;">If you did not create this account, please ignore this email.</p>
    </div>
  `;
}


export function emailVerificationTemplate(verifyUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">Verify your email</h2>
      <p>Thanks for signing up. Please confirm your email address to activate your account. This link expires in 24 hours.</p>
      <a href="${verifyUrl}" style="display:inline-block; background:#0f172a; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; margin-top:16px;">Verify Email</a>
      <p style="margin-top: 24px; color: #64748b; font-size: 13px;">If you did not create this account, please ignore this email.</p>
    </div>
  `;
}

export function passwordResetTemplate(resetUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">Reset your password</h2>
      <p>We received a request to reset your password. Click the button below to continue. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block; background:#0f172a; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; margin-top:16px;">Reset Password</a>
      <p style="margin-top: 24px; color: #64748b; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;
}

export function depositApprovedTemplate(fullName: string, amount: number): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Deposit Approved ✅</h2>
      <p>Hi ${fullName}, your deposit of <strong>$${amount.toLocaleString()}</strong> has been approved and credited to your account balance.</p>
    </div>
  `;
}

export function depositAdminNotificationTemplate(userEmail: string, amount: number): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">New Deposit Request</h2>
      <p>User <strong>${userEmail}</strong> submitted a deposit request of <strong>$${amount.toLocaleString()}</strong>. Please review it in the admin dashboard.</p>
    </div>
  `;
}

export function withdrawalApprovedTemplate(fullName: string, amount: number): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Withdrawal Approved ✅</h2>
      <p>Hi ${fullName}, your withdrawal request of <strong>$${amount.toLocaleString()}</strong> has been approved and is being processed.</p>
    </div>
  `;
}

export function withdrawalAdminNotificationTemplate(userEmail: string, amount: number): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">New Withdrawal Request</h2>
      <p>User <strong>${userEmail}</strong> requested a withdrawal of <strong>$${amount.toLocaleString()}</strong>. Please review it in the admin dashboard.</p>
    </div>
  `;
}

export function investmentAdminNotificationTemplate(
  userEmail: string,
  planName: string,
  amount: number,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">New Investment Created</h2>
      <p>User <strong>${userEmail}</strong> just invested <strong>$${amount.toLocaleString()}</strong> in the <strong>${planName}</strong> plan.</p>
    </div>
  `;
}

export function investmentMaturedTemplate(
  fullName: string,
  planName: string,
  profit: number,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Investment Matured 🎉</h2>
      <p>Hi ${fullName}, your investment in <strong>${planName}</strong> has matured. A profit of <strong>$${profit.toLocaleString()}</strong> has been credited to your wallet.</p>
    </div>
  `;
}

export function withdrawalRejectedTemplate(fullName: string, amount: number, reason?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Withdrawal Rejected</h2>
      <p>Hi ${fullName}, your withdrawal request of <strong>$${amount.toLocaleString()}</strong> was rejected.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ''}
    </div>
  `;
}

export function depositRejectedTemplate(fullName: string, amount: number, reason?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Deposit Rejected</h2>
      <p>Hi ${fullName}, your deposit request of <strong>$${amount.toLocaleString()}</strong> was rejected.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ''}
    </div>
  `;
}


export function accountBlockedTemplate(fullName: string, reason?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #A8392F;">Account Suspended</h2>
      <p>Hi ${fullName}, your account has been suspended by our team.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ''}
      <p>If you believe this is a mistake, please contact support.</p>
    </div>
  `;
}

export function accountUnblockedTemplate(fullName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Account Reinstated ✅</h2>
      <p>Hi ${fullName}, your account has been reinstated. You can now log in as normal.</p>
    </div>
  `;
}

export function withdrawalsBlockedTemplate(fullName: string, reason?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #A8392F;">Withdrawals Restricted</h2>
      <p>Hi ${fullName}, your ability to request withdrawals has been temporarily restricted.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ''}
    </div>
  `;
}

export function withdrawalsUnblockedTemplate(fullName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Withdrawals Restored ✅</h2>
      <p>Hi ${fullName}, you can now request withdrawals again.</p>
    </div>
  `;
}

export function balanceAdjustedTemplate(fullName: string, amount: number, reason: string): string {
  const isCredit = amount >= 0;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${isCredit ? '#16a34a' : '#A8392F'};">Balance ${isCredit ? 'Credited' : 'Adjusted'}</h2>
      <p>Hi ${fullName}, your account balance was ${isCredit ? 'credited' : 'debited'} by $${Math.abs(amount).toLocaleString()}.</p>
      <p>Reason: ${reason}</p>
    </div>
  `;
}

export function investmentCancelledTemplate(fullName: string, planName: string, refundAmount: number): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">Investment Cancelled</h2>
      <p>Hi ${fullName}, your investment in <strong>${planName}</strong> has been cancelled by our team.</p>
      <p>Your principal of $${refundAmount.toLocaleString()} has been refunded to your balance.</p>
    </div>
  `;
}

export function investmentPausedTemplate(fullName: string, planName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">Investment Paused</h2>
      <p>Hi ${fullName}, your investment in <strong>${planName}</strong> has been paused by our team. The countdown to maturity is on hold until it's resumed.</p>
    </div>
  `;
}

export function investmentResumedTemplate(fullName: string, planName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Investment Resumed ✅</h2>
      <p>Hi ${fullName}, your investment in <strong>${planName}</strong> has resumed counting down to maturity.</p>
    </div>
  `;
}