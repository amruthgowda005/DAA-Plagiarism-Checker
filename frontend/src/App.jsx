import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Compare from './pages/Compare';
import MultiCompare from './pages/MultiCompare';
import Results from './pages/Results';
import MediaAnalysis from './pages/MediaAnalysis';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="compare" element={<Compare />} />
          <Route path="multi-compare" element={<MultiCompare />} />
          <Route path="media-analysis" element={<MediaAnalysis />} />
          <Route path="results/:id" element={<Results />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
