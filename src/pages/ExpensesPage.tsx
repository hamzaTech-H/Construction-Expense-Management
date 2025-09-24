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
  const [showModifyExpense, setShowModifyExpense] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState<number | null>(null);
  const [deleteExpenseDescription, setDeleteExpenseDescription] = useState<string>('');
  const [showPayments, setShowPayments] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenseForm, setExpenseForm] = useState({ description: '', unitPrice: '', quantity: '' });
  const [modifyExpenseForm, setModifyExpenseForm] = useState({ description: '', unitPrice: '', quantity: '' });
  const [modifyExpenseId, setModifyExpenseId] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: '', note: '' });

  useEffect(() => {
    loadExpenses();
  }, [currentInvoice.id]);

  const loadExpenses = async () => {
    try {
      const data = await (window.database as any).getExpensesByInvoice(currentInvoice.id);
      setExpenses(data);
      
      // Update invoice totals based on expenses
      const totalProjectAmount = data.reduce((sum: number, expense: any) => sum + expense.total_price, 0);
      const totalAmountPaid = data.reduce((sum: number, expense: any) => sum + expense.amount_paid, 0);
      const totalRemainingAmount = totalProjectAmount - totalAmountPaid;
      
      // Update the invoice amounts in the database
      await (window.database as any).updateInvoiceAmounts(
        currentInvoice.id,
        totalProjectAmount,
        totalAmountPaid,
        totalRemainingAmount
      );
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadPayments = async (expenseId: number) => {
    try {
      const data = await (window.database as any).getPaymentsByExpense(expenseId);
      setPayments(data);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await (window.database as any).addExpense(
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
    
    const paymentAmount = parseFloat(paymentForm.amount);
    const totalPaidAfterPayment = currentExpense.amount_paid + paymentAmount;
    
    // Verify that total Amount Paid does not exceed Total Price
    if (totalPaidAfterPayment > currentExpense.total_price) {
      alert(`Payment amount would exceed the total price. Maximum payment allowed: $${(currentExpense.total_price - currentExpense.amount_paid).toFixed(2)}`);
      // Don't clear the form, keep inputs editable
      return;
    }
    
    try {
      await (window.database as any).addPayment(
        currentExpense.id,
        paymentAmount,
        paymentForm.date,
        paymentForm.note
      );
      
      // Update the expense amounts in the database
      const newAmountPaid = currentExpense.amount_paid + paymentAmount;
      const newRemainingAmount = currentExpense.total_price - newAmountPaid;
      const newStatus = newAmountPaid === 0 ? 'Not Paid' : 
                       newAmountPaid >= currentExpense.total_price ? 'Paid' : 'Partially Paid';
      
      await (window.database as any).updateExpenseAmounts(
        currentExpense.id,
        newAmountPaid,
        newRemainingAmount,
        newStatus
      );
      
      setPaymentForm({ amount: '', date: '', note: '' });
      // Don't close the popup automatically - let user close it manually
      loadPayments(currentExpense.id);
      loadExpenses(); // Refresh expenses to update amounts
      
      // Also refresh the current expense data
      const updatedExpense = await (window.database as any).getExpenseById(currentExpense.id);
      setCurrentExpense(updatedExpense);
    } catch (error) {
      console.error('Error adding payment:', error);
      // Don't clear the form on error, keep inputs editable
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await (window.database as any).deleteExpense(id);
      loadExpenses();
      setShowDeleteConfirm(false);
      setDeleteExpenseId(null);
      setDeleteExpenseDescription('');
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const confirmDeleteExpense = (expense: Expense) => {
    setDeleteExpenseId(expense.id);
    setDeleteExpenseDescription(expense.description);
    setShowDeleteConfirm(true);
  };

  const handleModifyExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyExpenseId) return;
    try {
      await (window.database as any).updateExpense(
        modifyExpenseId,
        modifyExpenseForm.description,
        parseFloat(modifyExpenseForm.unitPrice),
        parseInt(modifyExpenseForm.quantity)
      );
      setModifyExpenseForm({ description: '', unitPrice: '', quantity: '' });
      setShowModifyExpense(false);
      setModifyExpenseId(null);
      loadExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const openModifyExpense = (expense: Expense) => {
    setModifyExpenseForm({
      description: expense.description,
      unitPrice: expense.unit_price.toString(),
      quantity: expense.quantity.toString()
    });
    setModifyExpenseId(expense.id);
    setShowModifyExpense(true);
  };

  const getExpenseStatus = (expense: Expense) => {
    if (expense.amount_paid === 0) return 'Not Paid';
    if (expense.amount_paid >= expense.total_price) return 'Paid';
    return 'Partially Paid';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Not Paid':
        return 'bg-red-100 text-red-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Partially Paid':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const invoiceHTML = `
        <html>
          <head>
            <title>Invoice - ${currentInvoice.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .invoice-info { margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .totals { margin-top: 30px; text-align: right; }
              .totals table { width: 300px; margin-left: auto; }
              .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
              .status-not-paid { background-color: #fee2e2; color: #dc2626; }
              .status-paid { background-color: #dcfce7; color: #16a34a; }
              .status-partially-paid { background-color: #fed7aa; color: #ea580c; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>INVOICE</h1>
              <h2>${currentInvoice.name}</h2>
              <p>Date: ${currentInvoice.date}</p>
            </div>
            
            <div class="invoice-info">
              <p><strong>Invoice ID:</strong> ${currentInvoice.id}</p>
              <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Total Price</th>
                  <th>Amount Paid</th>
                  <th>Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${expenses.map(expense => {
                  const status = getExpenseStatus(expense);
                  const statusClass = status === 'Not Paid' ? 'status-not-paid' : 
                                    status === 'Paid' ? 'status-paid' : 'status-partially-paid';
                  return `
                    <tr>
                      <td>${expense.description}</td>
                      <td>$${expense.unit_price.toFixed(2)}</td>
                      <td>${expense.quantity}</td>
                      <td>$${expense.total_price.toFixed(2)}</td>
                      <td>$${expense.amount_paid.toFixed(2)}</td>
                      <td>$${expense.remaining_amount.toFixed(2)}</td>
                      <td><span class="status-badge ${statusClass}">${status}</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <table>
                <tr>
                  <td><strong>Total Project Amount:</strong></td>
                  <td><strong>$${expenses.reduce((sum, expense) => sum + expense.total_price, 0).toFixed(2)}</strong></td>
                </tr>
                <tr>
                  <td><strong>Total Amount Paid:</strong></td>
                  <td><strong>$${expenses.reduce((sum, expense) => sum + expense.amount_paid, 0).toFixed(2)}</strong></td>
                </tr>
                <tr>
                  <td><strong>Total Remaining:</strong></td>
                  <td><strong>$${expenses.reduce((sum, expense) => sum + expense.remaining_amount, 0).toFixed(2)}</strong></td>
                </tr>
              </table>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handlePrintPaymentHistory = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && currentExpense) {
      const paymentHistoryHTML = `
        <html>
          <head>
            <title>Payment History - ${currentExpense.description}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Payment History</h1>
              <h2>${currentExpense.description}</h2>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Payment Amount</th>
                  <th>Date</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map(payment => `
                  <tr>
                    <td>$${payment.amount.toFixed(2)}</td>
                    <td>${payment.date}</td>
                    <td>${payment.note || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(paymentHistoryHTML);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button and Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="text-sky-600 hover:text-sky-800 mb-4 flex items-center gap-2"
          >
            ← Back to Invoices
          </button>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Invoice Details - {currentInvoice.name}</h1>
            <div className="flex gap-2">
              <button 
                onClick={handlePrintInvoice}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(getExpenseStatus(expense))}`}>
                      {getExpenseStatus(expense)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmDeleteExpense(expense)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          openModifyExpense(expense);
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
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

        {/* Totals Section */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Totals</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Price</p>
              <p className="text-2xl font-bold text-gray-900">
                ${expenses.reduce((sum, expense) => sum + expense.total_price, 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
              <p className="text-2xl font-bold text-green-600">
                ${expenses.reduce((sum, expense) => sum + expense.amount_paid, 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Remaining</p>
              <p className="text-2xl font-bold text-red-600">
                ${expenses.reduce((sum, expense) => sum + expense.remaining_amount, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Add Expense Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-30 flex items-center justify-center z-50">
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
                  onKeyDown={(e) => {
                    // Prevent 'e', 'E', '+', '-' characters
                    if (['e', 'E', '+', '-'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
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
                  onKeyDown={(e) => {
                    // Prevent 'e', 'E', '+', '-' characters
                    if (['e', 'E', '+', '-'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
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

      {/* Modify Expense Modal */}
      {showModifyExpense && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Modify Expense</h2>
            <form onSubmit={handleModifyExpense}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Expense Detail</label>
                <input
                  type="text"
                  value={modifyExpenseForm.description}
                  onChange={(e) => setModifyExpenseForm({ ...modifyExpenseForm, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={modifyExpenseForm.unitPrice}
                  onChange={(e) => setModifyExpenseForm({ ...modifyExpenseForm, unitPrice: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent 'e', 'E', '+', '-' characters
                    if (['e', 'E', '+', '-'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  value={modifyExpenseForm.quantity}
                  onChange={(e) => setModifyExpenseForm({ ...modifyExpenseForm, quantity: e.target.value })}
                  onKeyDown={(e) => {
                    // Prevent 'e', 'E', '+', '-' characters
                    if (['e', 'E', '+', '-'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModifyExpense(false);
                    setModifyExpenseId(null);
                    setModifyExpenseForm({ description: '', unitPrice: '', quantity: '' });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-sky-600 text-white py-2 rounded-lg hover:bg-sky-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payments Modal */}
      {showPayments && currentExpense && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-4/5 max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Payments for {currentExpense.description}</h2>
            
            {/* Payment History */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Payment History</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <button 
                  onClick={handlePrintPaymentHistory}
                  className="mb-3 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Expense</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete <strong>"{deleteExpenseDescription}"</strong>? 
                This action cannot be undone and will also delete all associated payments.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteExpenseId(null);
                    setDeleteExpenseDescription('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteExpenseId && handleDeleteExpense(deleteExpenseId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
