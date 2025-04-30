import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create context
const UserContext = createContext();

// Create provider component
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize or get device ID (Keep this as is)
  useEffect(() => {
    const savedDeviceId = localStorage.getItem('skillshare_device_id');
    if (!savedDeviceId) {
      const newDeviceId = crypto.randomUUID();
      localStorage.setItem('skillshare_device_id', newDeviceId);
    }
  }, []);

  // Combined check for user session (localStorage or backend session)
  useEffect(() => {
    const checkUserSession = async () => {
      setLoading(true);
      try {
        // 1. Check localStorage first (for traditional token-based login)
        const savedUser = localStorage.getItem('skillshare_user');
        const savedToken = localStorage.getItem('skillshare_token');

        if (savedUser && savedToken) {
          // User logged in via traditional method
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          console.log('User loaded from localStorage');
        } else {
          // 2. If no token, check backend session (for OAuth2 or expired token)
          try {
            // Use { withCredentials: true } to send session cookies
            const response = await axios.get('http://localhost:8081/api/user/current', { withCredentials: true });
            if (response.data) {
              setCurrentUser(response.data);
              // Store user data in localStorage for consistency, but session is primary
              localStorage.setItem('skillshare_user', JSON.stringify(response.data));
              // Clear potentially stale token header if using session
              delete axios.defaults.headers.common['Authorization'];
              localStorage.removeItem('skillshare_token'); // Remove potentially stale token
              console.log('User loaded from backend session');
            } else {
              // Backend confirms no active session
              throw new Error('No active session'); // Treat as error to trigger catch block
            }
          } catch (apiError) {
            // API call failed (e.g., 401/403 means no session, network error)
            console.log('No active backend session found or API error:', apiError.message);
            setCurrentUser(null);
            localStorage.removeItem('skillshare_user');
            localStorage.removeItem('skillshare_token');
            delete axios.defaults.headers.common['Authorization'];
          }
        }
      } catch (error) {
        console.error('Error during user session check:', error);
        // Ensure clean state on any error
        setCurrentUser(null);
        localStorage.removeItem('skillshare_user');
        localStorage.removeItem('skillshare_token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false); // Stop loading after checks are complete
      }
    };

    checkUserSession();
  }, []); // Run only once on mount

  // Function to register user (Keep as is)
  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:8081/api/auth/register', userData);
      const user = response.data;
      setCurrentUser(user);
      localStorage.setItem('skillshare_user', JSON.stringify(user));
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  // Function to login user (Keep existing login function for email/password)
  const login = async (credentials) => {
    setLoading(true); // Indicate loading during login attempt
    try {
      const deviceId = localStorage.getItem('skillshare_device_id');
      const response = await axios.post('http://localhost:8081/api/auth/login',
        credentials,
        {
          headers: {
            'X-Device-ID': deviceId,
            'Content-Type': 'application/json'
          }
        }
      );

      const { user, token } = response.data;

      // Store auth data
      setCurrentUser(user);
      localStorage.setItem('skillshare_user', JSON.stringify(user));
      localStorage.setItem('skillshare_token', token);

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setLoading(false);
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      setCurrentUser(null); // Clear user state on login failure
      localStorage.removeItem('skillshare_user');
      localStorage.removeItem('skillshare_token');
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
      return {
        success: false,
        error: error.response?.data?.message || 'Invalid credentials'
      };
    }
  };

  // Function to update user (Keep as is)
  const updateUser = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('skillshare_user', JSON.stringify(userData));
  };

  // Function to logout (Ensure it clears session potentially)
  const logout = async () => {
    setLoading(true);
    try {
      // Attempt backend logout (might invalidate session)
      await axios.post('http://localhost:8081/api/auth/logout', {}, {
         headers: { 'Authorization': `Bearer ${localStorage.getItem('skillshare_token')}` }, // Send token if exists
         withCredentials: true // Send cookies if exists
      });
       console.log('Backend logout called');
    } catch (error) {
      // Log error but proceed with client-side cleanup
      console.error('Backend logout error (might be expected if session expired):', error);
    } finally {
      // Always clear client-side state
      setCurrentUser(null);
      localStorage.removeItem('skillshare_user');
      localStorage.removeItem('skillshare_token');
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
      console.log('Client-side logout complete');
      // Optional: Redirect to login page after logout
      // window.location.href = '/login';
    }
  };

  return (
    <UserContext.Provider value={{
      currentUser,
      loading,
      register,
      login,
      updateUser,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Create custom hook for using user context (Keep as is)
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
