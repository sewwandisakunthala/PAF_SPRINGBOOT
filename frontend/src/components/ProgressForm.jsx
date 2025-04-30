import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const ProgressForm = ({ onProgressCreated, onProgressUpdated, initialData, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [status, setStatus] = useState('NOT_STARTED');
  const [startDate, setStartDate] = useState(new Date());
  const [targetDate, setTargetDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default: 1 week from now
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useUser();
  
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCompletionPercentage(initialData.completionPercentage || 0);
      setStatus(initialData.status || 'NOT_STARTED');
      setStartDate(initialData.startDate ? new Date(initialData.startDate) : new Date());
      setTargetDate(initialData.targetDate ? new Date(initialData.targetDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      setSkills(initialData.skills || []);
    }
  }, [initialData]);

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (newStatus === 'COMPLETED') {
      setCompletionPercentage(100);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('skillshare_token');
      
      const progressData = {
        title,
        description,
        completionPercentage,
        status,
        startDate,
        targetDate,
        skills,
        userId: currentUser.id
      };

      let response;
      if (isEditing) {
        response = await axios.put(
          `http://localhost:8081/api/progress/${initialData.id}?userId=${currentUser.id}`,
          progressData,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (onProgressUpdated) {
          onProgressUpdated(response.data);
        }
      } else {
        response = await axios.post(
          'http://localhost:8081/api/progress',
          progressData,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (onProgressCreated) {
          onProgressCreated(response.data);
        }
      }

      // Reset form if not editing
      if (!isEditing) {
        setTitle('');
        setDescription('');
        setCompletionPercentage(0);
        setStatus('NOT_STARTED');
        setStartDate(new Date());
        setTargetDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        setSkills([]);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      setError(error.response?.data?.message || 'Failed to save progress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Update Learning Goal' : 'Create New Learning Goal'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
              placeholder="e.g., Learn React.js Fundamentals"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows="3"
              placeholder="Describe your learning goal..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={date => setStartDate(date)}
              className="w-full p-2 border border-gray-300 rounded-md"
              dateFormat="MMMM d, yyyy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Completion Date
            </label>
            <DatePicker
              selected={targetDate}
              onChange={date => setTargetDate(date)}
              className="w-full p-2 border border-gray-300 rounded-md"
              dateFormat="MMMM d, yyyy"
              minDate={new Date()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Completion Percentage
            </label>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={completionPercentage}
                onChange={(e) => setCompletionPercentage(parseInt(e.target.value))}
                className="w-full mr-2"
                disabled={status === 'COMPLETED'}
              />
              <span className="text-sm font-medium">{completionPercentage}%</span>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills to Learn
            </label>
            <div className="flex">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-l-md"
                placeholder="e.g., JavaScript, CSS, etc."
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            
            {skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-100 px-3 py-1 rounded-full flex items-center"
                  >
                    <span className="text-sm text-gray-700">{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting 
              ? 'Saving...' 
              : (isEditing ? 'Update Goal' : 'Create Goal')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProgressForm;
