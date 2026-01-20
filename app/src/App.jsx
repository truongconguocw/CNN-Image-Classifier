import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import ImageClassification from './pages/Imageclassification';
import ModelEvolution from './pages/Modelevolution';
import KFoldAnalysis from './pages/KFoldAnalysis';
import SetFaceID from './pages/Setfaceid';
import Users from './pages/Users';
import RealTimeRecognition from './pages/RealTimeRecognition';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="classification" element={<ImageClassification />} />
                    <Route path="evolution" element={<ModelEvolution />} />
                    <Route path="kfold" element={<KFoldAnalysis />} />
                    <Route path="users" element={<Users />} />
                    <Route path="realtime" element={<RealTimeRecognition />} />
                </Route>
                <Route path="/set-faceid" element={<SetFaceID />} />
            </Routes>
        </Router>
    );
}

export default App;
