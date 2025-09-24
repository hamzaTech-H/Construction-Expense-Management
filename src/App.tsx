import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit, FileText } from 'lucide-react';
import InvoicesPage from './pages/InvoicesPage';
import ExpensesPage from './pages/ExpensesPage';

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

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState('projects'); // 'projects', 'invoices', 'expenses'
  const [showModifyProject, setShowModifyProject] = useState(false);
  const [modifyProjectId, setModifyProjectId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);
  const [deleteProjectName, setDeleteProjectName] = useState<string>('');
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const [itemsPerPage] = useState(6);

  // Form states
  const [projectForm, setProjectForm] = useState({ name: '', clientName: '', description: '' });
  const [modifyProjectForm, setModifyProjectForm] = useState({ name: '', clientName: '', description: '' });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await (window.database as any).getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await (window.database as any).addProject(projectForm.name, projectForm.clientName, projectForm.description);
      setProjectForm({ name: '', clientName: '', description: '' });
      setShowAddProject(false);
      loadProjects();
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await (window.database as any).deleteProject(id);
      loadProjects();
      setShowDeleteConfirm(false);
      setDeleteProjectId(null);
      setDeleteProjectName('');
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const confirmDeleteProject = (project: Project) => {
    setDeleteProjectId(project.id);
    setDeleteProjectName(project.name);
    setShowDeleteConfirm(true);
  };

  const handleModifyProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyProjectId) return;
    try {
      await (window.database as any).updateProject(
        modifyProjectId,
        modifyProjectForm.name,
        modifyProjectForm.clientName,
        modifyProjectForm.description
      );
      setModifyProjectForm({ name: '', clientName: '', description: '' });
      setShowModifyProject(false);
      setModifyProjectId(null);
      loadProjects();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const openModifyProject = (project: Project) => {
    setModifyProjectForm({
      name: project.name,
      clientName: project.client_name,
      description: project.description
    });
    setModifyProjectId(project.id);
    setShowModifyProject(true);
  };

  const handleViewInvoices = (project: Project) => {
    setCurrentProject(project);
    setCurrentPage('invoices');
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPageNum - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPageNum(page);
  };

  // Render different pages based on current state
  if (currentPage === 'invoices' && currentProject) {
    return (
      <InvoicesPage
        currentProject={currentProject}
        onBack={() => setCurrentPage('projects')}
        onInvoiceClick={(invoice) => {
          setCurrentInvoice(invoice);
          setCurrentPage('expenses');
        }}
      />
    );
  }

  if (currentPage === 'expenses' && currentInvoice) {
    return (
      <ExpensesPage
        currentInvoice={currentInvoice}
        onBack={() => setCurrentPage('invoices')}
      />
    );
  }

  // Main Projects Page
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">My Projects</h1>
          
          {/* Search and Add Button */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowAddProject(true)}
              className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Project
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewInvoices(project)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                  <p className="text-gray-600">{project.client_name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteProject(project);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModifyProject(project);
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-gray-700 text-sm mb-4">{project.description}</p>
              <button
                onClick={() => handleViewInvoices(project)}
                className="w-full bg-sky-600 text-white py-2 rounded-lg hover:bg-sky-700 flex items-center justify-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Show Invoices
              </button>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No projects found. Try adjusting your search or add a new project.</p>
          </div>
        )}

        {/* Pagination */}
        {filteredProjects.length > itemsPerPage && (
          <div className="flex justify-center items-center mt-8 gap-2">
            <button
              onClick={() => handlePageChange(currentPageNum - 1)}
              disabled={currentPageNum === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 border rounded-lg ${
                  currentPageNum === page
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPageNum + 1)}
              disabled={currentPageNum === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Add New Project</h2>
            <form onSubmit={handleAddProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                <input
                  type="text"
                  value={projectForm.clientName}
                  onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
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

      {/* Modify Project Modal */}
      {showModifyProject && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Modify Project</h2>
            <form onSubmit={handleModifyProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                <input
                  type="text"
                  value={modifyProjectForm.name}
                  onChange={(e) => setModifyProjectForm({ ...modifyProjectForm, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                <input
                  type="text"
                  value={modifyProjectForm.clientName}
                  onChange={(e) => setModifyProjectForm({ ...modifyProjectForm, clientName: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                <textarea
                  value={modifyProjectForm.description}
                  onChange={(e) => setModifyProjectForm({ ...modifyProjectForm, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModifyProject(false);
                    setModifyProjectId(null);
                    setModifyProjectForm({ name: '', clientName: '', description: '' });
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Project</h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete <strong>"{deleteProjectName}"</strong>? 
                This action cannot be undone and will also delete all associated invoices and expenses.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteProjectId(null);
                    setDeleteProjectName('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteProjectId && handleDeleteProject(deleteProjectId)}
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

export default App;