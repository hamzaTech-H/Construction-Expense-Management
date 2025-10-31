import { TFunction } from "i18next";

export enum ExpenseStatus {
  NOT_PAID = "Unpaid",
  PAID = "Paid",
  PARTIALLY_PAID = "Partially paid",
}


export function getExpenseStatusLabel(t: TFunction, status: ExpenseStatus): string {
  switch (status) {
    case ExpenseStatus.PAID:
      return t("Paid");
    case ExpenseStatus.PARTIALLY_PAID:
      return t("Partially paid");
    case ExpenseStatus.NOT_PAID:
    default:
      return t("Unpaid");
  }
}