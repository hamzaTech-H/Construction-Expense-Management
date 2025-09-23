import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  client_name: string;
  description: string;
}

interface Invoice {
  id: number;
  project_id: number;
  name: string;
  date: string;
  project_amount: number;
  amount_paid: number;
  remaining_amount: number;
}

interface InvoicesPageProps {
  currentProject: Project;
  onBack: () => void;
  onInvoiceClick: (invoice: Invoice) => void;
}

const InvoicesPage: React.FC<InvoicesPageProps> = ({ currentProject, onBack, onInvoiceClick }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ name: '', date: '' });

  useEffect(() => {
    loadInvoices();
  }, [currentProject.id]);

  const loadInvoices = async () => {
    try {
      const data = await window.database.getInvoicesByProject(currentProject.id);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await window.database.addInvoice(currentProject.id, invoiceForm.name, invoiceForm.date);
      setInvoiceForm({ name: '', date: '' });
      setShowAddInvoice(false);
      loadInvoices();
    } catch (error) {
      console.error('Error adding invoice:', error);
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    try {
      await window.database.deleteInvoice(id);
      loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const getTotalProjectAmount = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.project_amount, 0);
  };

  const getTotalAmountPaid = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.amount_paid, 0);
  };

  const getTotalRemainingAmount = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.remaining_amount, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Project Amount</h3>
            <p className="text-2xl font-bold text-sky-600">${getTotalProjectAmount().toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Amount Paid</h3>
            <p className="text-2xl font-bold text-green-600">${getTotalAmountPaid().toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Remaining Amount</h3>
            <p className="text-2xl font-bold text-red-600">${getTotalRemainingAmount().toFixed(2)}</p>
          </div>
        </div>

        {/* Title and Add Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoices of {currentProject.name}</h1>
            <div className="w-full h-0.5 bg-gray-300 mt-2"></div>
          </div>
          <button
            onClick={() => setShowAddInvoice(true)}
            className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Invoice
          </button>
        </div>

        {/* Invoice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{invoice.name}</h3>
                  <p className="text-gray-600">{invoice.date}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteInvoice(invoice.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button className="text-gray-600 hover:text-gray-800">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Project Amount:</span>
                  <span className="font-semibold">${invoice.project_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-green-600">${invoice.amount_paid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining:</span>
                  <span className="font-semibold text-red-600">${invoice.remaining_amount.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={() => onInvoiceClick(invoice)}
                className="w-full bg-sky-600 text-white py-2 rounded-lg hover:bg-sky-700"
              >
                Show Details
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onBack}
          className="mt-6 text-sky-600 hover:text-sky-800"
        >
          ← Back to Projects
        </button>
      </div>

      {/* Add Invoice Modal */}
      {showAddInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Add New Invoice</h2>
            <form onSubmit={handleAddInvoice}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Name</label>
                <input
                  type="text"
                  value={invoiceForm.name}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={invoiceForm.date}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddInvoice(false)}
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
    </div>
  );
};

export default InvoicesPage;
