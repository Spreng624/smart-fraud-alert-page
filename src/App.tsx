import { Route, Routes } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import GraphPage from '@/pages/graph';
import HomePage from '@/pages/home';
import RiskPage from '@/pages/risk';
import StatisticsPage from '@/pages/statistics';
import VictimPage from '@/pages/victim';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/risk/*" element={<RiskPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/victim" element={<VictimPage />} />
          <Route path="/graph" element={<GraphPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
