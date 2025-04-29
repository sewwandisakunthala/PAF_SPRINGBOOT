import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import ProgressForm from '../components/ProgressForm';
import ProgressCard from '../components/ProgressCard';
import { motion } from 'framer-motion';

const ProgressPage = () => {
  const [progressItems, setProgressItems] = useState([]);
  const [summary, setSummary] = useState({
    totalCount: 0,
    notStartedCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    averageCompletion: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProgress, setEditingProgress] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const { currentUser } = useUser();

  useEffect(() => {
    if (currentUser) {
      fetchProgressItems();
      fetchProgressSummary();
    }
  }, [currentUser]);

  const fetchProgressItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('skillshare_token');
      const response = await axios.get(
        `http://localhost:8081/api/users/${currentUser.id}/progress`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setProgressItems(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching progress items:', err);
      setError('Failed to load progress items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressSummary = async () => {
    try {
      const token = localStorage.getItem('skillshare_token');
      const response = await axios.get(
        `http://localhost:8081/api/users/${currentUser.id}/progress/summary`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setSummary(response.data);
    } catch (err) {
      console.error('Error fetching progress summary:', err);
    }
  };

  const handleProgressCreated = (newProgress) => {
    setProgressItems([newProgress, ...progressItems]);
    fetchProgressSummary();
    setShowForm(false);
  };

  const handleProgressUpdated = (updatedProgress) => {
    setProgressItems(prevItems => 
      prevItems.map(item => 
        item.id === updatedProgress.id ? updatedProgress : item
      )
    );
    fetchProgressSummary();
    setEditingProgress(null);
  };

  const handleProgressDeleted = (progressId) => {
    setProgressItems(prevItems => 
      prevItems.filter(item => item.id !== progressId)
    );
    fetchProgressSummary();
  };

  const handleEditClick = (progress) => {
    setEditingProgress(progress);
    setShowForm(true);
  };

  const filteredProgressItems = progressItems.filter(item => {
    if (activeFilter === 'all') return true;
    return item.status === activeFilter;
  });

  const renderProgressStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
        <h3 className="text-lg font-medium text-gray-700">Total Goals</h3>
        <p className="text-2xl font-bold">{summary.totalCount}</p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
        <h3 className="text-lg font-medium text-gray-700">Not Started</h3>
        <p className="text-2xl font-bold">{summary.notStartedCount}</p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
        <h3 className="text-lg font-medium text-gray-700">In Progress</h3>
        <p className="text-2xl font-bold">{summary.inProgressCount}</p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
        <h3 className="text-lg font-medium text-gray-700">Completed</h3>
        <p className="text-2xl font-bold">{summary.completedCount}</p>
      </div>
    </div>
  );

  const renderProgressFilter = () => (
    <div className="flex gap-2 mb-4 overflow-x-auto">
      <button
        onClick={() => setActiveFilter('all')}
        className={`px-4 py-2 rounded-lg whitespace-nowrap ${
          activeFilter === 'all' 
            ? 'bg-blue-500 text-white' 
            : 'bg-white text-gray-700'
        }`}
      >
        All
      </button>
      <button
        onClick={() => setActiveFilter('NOT_STARTED')}
        className={`px-4 py-2 rounded-lg whitespace-nowrap ${
          activeFilter === 'NOT_STARTED' 
            ? 'bg-yellow-500 text-white' 
            : 'bg-white text-gray-700'
        }`}
      >
        Not Started
      </button>
      <button
        onClick={() => setActiveFilter('IN_PROGRESS')}
        className={`px-4 py-2 rounded-lg whitespace-nowrap ${
          activeFilter === 'IN_PROGRESS' 
            ? 'bg-purple-500 text-white' 
            : 'bg-white text-gray-700'
        }`}
      >
        In Progress
      </button>
      <button
        onClick={() => setActiveFilter('COMPLETED')}
        className={`px-4 py-2 rounded-lg whitespace-nowrap ${
          activeFilter === 'COMPLETED' 
            ? 'bg-green-500 text-white' 
            : 'bg-white text-gray-700'
        }`}
      >
        Completed
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Learning Progress</h1>
        <button
          onClick={() => {
            setEditingProgress(null);
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add New Goal'}
        </button>
      </div>

      {renderProgressStats()}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4"
          >
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-semibold">
                {editingProgress ? 'Edit Learning Goal' : 'Create New Learning Goal'}
              </h2>
              <button 
                onClick={() => {
                  setShowForm(false);
                  setEditingProgress(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <ProgressForm
                onProgressCreated={handleProgressCreated}
                onProgressUpdated={handleProgressUpdated}
                initialData={editingProgress}
                onCancel={() => {
                  setShowForm(false);
                  setEditingProgress(null);
                }}
              />
            </div>
          </motion.div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {renderProgressFilter()}

      {loading ? (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredProgressItems.length > 0 ? (
        <div className="space-y-4">
          {filteredProgressItems.map(progress => (
            <ProgressCard
              key={progress.id}
              progress={progress}
              onEdit={() => handleEditClick(progress)}
              onDelete={handleProgressDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">
            {activeFilter === 'all' 
              ? "You haven't created any learning goals yet. Click 'Add New Goal' to get started!"
              : `No learning goals with status: ${activeFilter.replace('_', ' ').toLowerCase()}`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;
