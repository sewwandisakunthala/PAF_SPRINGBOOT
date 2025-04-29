import { useState } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const ProgressCard = ({ progress, onEdit, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { currentUser } = useUser();
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'NOT_STARTED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case 'COMPLETED': return 'Completed';
      case 'IN_PROGRESS': return 'In Progress';
      case 'NOT_STARTED': return 'Not Started';
      default: return status;
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const daysRemaining = () => {
    if (!progress.targetDate) return null;
    if (progress.status === 'COMPLETED') return 'Completed';
    
    const today = new Date();
    const target = new Date(progress.targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
  };
  
  const handleQuickStatusUpdate = async (newStatus) => {
    if (progress.status === newStatus) return;
    
    try {
      setIsUpdatingStatus(true);
      const token = localStorage.getItem('skillshare_token');
      
      const updatedProgress = { 
        ...progress,
        status: newStatus,
        completionPercentage: newStatus === 'COMPLETED' ? 100 : progress.completionPercentage
      };
      
      const response = await axios.put(
        `http://localhost:8081/api/progress/${progress.id}?userId=${currentUser.id}`,
        updatedProgress,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (onEdit) {
        onEdit(response.data);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  const handleDelete = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this learning goal?');
    if (!confirmDelete) return;
    
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('skillshare_token');
      
      await axios.delete(
        `http://localhost:8081/api/progress/${progress.id}?userId=${currentUser.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (onDelete) {
        onDelete(progress.id);
      }
    } catch (error) {
      console.error('Error deleting progress:', error);
      alert('Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-800">{progress.title}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(progress.status)}`}>
            {getStatusLabel(progress.status)}
          </span>
        </div>
        
        {progress.description && (
          <p className="text-gray-600 mb-4">{progress.description}</p>
        )}
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">{progress.completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${progress.completionPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="font-medium">{formatDate(progress.startDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Target Date</p>
            <p className="font-medium">{formatDate(progress.targetDate)}</p>
          </div>
        </div>
        
        {progress.targetDate && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">Timeline</p>
            <p className={`font-medium ${
              daysRemaining() === 'Overdue' ? 'text-red-600' : 
              daysRemaining() === 'Due today' ? 'text-orange-600' : 
              'text-gray-700'
            }`}>
              {daysRemaining()}
            </p>
          </div>
        )}
        
        {progress.skills && progress.skills.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {progress.skills.map((skill, index) => (
                <span 
                  key={index} 
                  className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            {progress.status !== 'COMPLETED' && (
              <button
                onClick={() => handleQuickStatusUpdate('COMPLETED')}
                disabled={isUpdatingStatus}
                className={`px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm ${
                  isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Mark Complete
              </button>
            )}
            {progress.status === 'NOT_STARTED' && (
              <button
                onClick={() => handleQuickStatusUpdate('IN_PROGRESS')}
                disabled={isUpdatingStatus}
                className={`px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 text-sm ${
                  isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Start Learning
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm ${
                isDeleting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressCard;
