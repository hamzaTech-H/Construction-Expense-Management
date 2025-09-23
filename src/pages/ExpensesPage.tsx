import React, { useState, useEffect } from 'react';
import { Trash2, Edit, FileText } from 'lucide-react';

interface Invoice {
  id: number;
  project_id: number;
  name: string;
  date: string;
  project_amount: number;
  amount_paid: number;
  remaining_amount: number;
}

interface Expense {
  id: number;
  invoice_id: number;
  description: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  amount_paid: number;
  remaining_amount: number;
  status: string;
}

interface Payment {
  id: number;
  expense_id: number;
  amount: number;
  date: string;
  note: string;
}

interface ExpensesPageProps {
  currentInvoice: Invoice;
  onBack: () => void;
}

const ExpensesPage: React.FC<ExpensesPageProps> = ({ currentInvoice, onBack }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenseForm, setExpenseForm] = useState({ description: '', unitPrice: '', quantity: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: '', note: '' });

  useEffect(() => {
    loadExpenses();
  }, [currentInvoice.id]);

  const loadExpenses = async () => {
    try {
      const data = await window.database.getExpensesByInvoice(currentInvoice.id);
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadPayments = async (expenseId: number) => {
    try {
      const data = await window.database.getPaymentsByExpense(expenseId);
      setPayments(data);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await window.database.addExpense(
        currentInvoice.id,
        expenseForm.description,
        parseFloat(expenseForm.unitPrice),
        parseInt(expenseForm.quantity)
      );
      setExpenseForm({ description: '', unitPrice: '', quantity: '' });
      setShowExpenseForm(false);
      loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExpense) return;
    try {
      await window.database.addPayment(
        currentExpense.id,
        parseFloat(paymentForm.amount),
        paymentForm.date,
        paymentForm.note
      );
      setPaymentForm({ amount: '', date: '', note: '' });
      setShowPayments(false);
      loadPayments(currentExpense.id);
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await window.database.deleteExpense(id);
      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const getExpenseStatus = (expense: Expense) => {
    if (expense.amount_paid === 0) return 'Not Paid';
    if (expense.amount_paid >= expense.total_price) return 'Paid';
    return 'Partially Paid';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Invoice Details - {currentInvoice.name}</h1>
          <div className="flex gap-2">
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
              Print Invoice
            </button>
            <button
              onClick={() => setShowExpenseForm(true)}
              className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700"
            >
              Add New Expense
            </button>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.description} - {expense.quantity} x ${expense.unit_price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${expense.total_price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${expense.amount_paid.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${expense.remaining_amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getExpenseStatus(expense)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentExpense(expense);
                          setShowPayments(true);
                          loadPayments(expense.id);
                        }}
                        className="text-sky-600 hover:text-sky-800"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={onBack}
          className="mt-6 text-sky-600 hover:text-sky-800"
        >
          ← Back to Invoices
        </button>
      </div>

      {/* Add Expense Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Add New Expense</h2>
            <form onSubmit={handleAddExpense}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Expense Detail</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseForm.unitPrice}
                  onChange={(e) => setExpenseForm({ ...expenseForm, unitPrice: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  value={expenseForm.quantity}
                  onChange={(e) => setExpenseForm({ ...expenseForm, quantity: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-600 text-white py-2 rounded-lg hover:bg-sky-700"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payments Modal */}
      {showPayments && currentExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-4/5 max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Payments for {currentExpense.description}</h2>
            
            {/* Payment History */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Payment History</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <button className="mb-3 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                  Print Payment History
                </button>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Payment Amount</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="py-2">${payment.amount.toFixed(2)}</td>
                        <td className="py-2">{payment.date}</td>
                        <td className="py-2">{payment.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add New Payment */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Add New Payment</h3>
              <form onSubmit={handleAddPayment}>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={paymentForm.date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                    <input
                      type="text"
                      value={paymentForm.note}
                      onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPayments(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-sky-600 text-white py-2 rounded-lg hover:bg-sky-700"
                  >
                    Add Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
