import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(formData);
    
    setIsLoading(false);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to the backend endpoint that initiates Google OAuth flow
    window.location.href = 'http://localhost:8081/login/oauth2/code/google';
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-gray-100 rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-indigo-700">Welcome Back</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-800 text-sm font-bold mb-2" htmlFor="username">
              Username or Email
            </label>
            <input
              className="appearance-none border-2 border-gray-300 bg-white rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:border-indigo-500"
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter your username or email"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-800 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="appearance-none border-2 border-gray-300 bg-white rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:border-indigo-500"
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>
          
          <div className="flex flex-col space-y-4">
            <button
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-gray-400"></div>
              <span className="flex-shrink mx-4 text-gray-500">OR</span>
              <div className="flex-grow border-t border-gray-400"></div>
            </div>

            {/* Google Login Button */}
            <button
              type="button" // Important: type="button" to prevent form submission
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline flex items-center justify-center space-x-2"
            >
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="w-5 h-5" />
              <span>Sign in with Google</span>
            </button>
            
            <div className="text-center mt-4">
              <span className="text-gray-800">Don't have an account? </span>
              <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-semibold">
                Register
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
