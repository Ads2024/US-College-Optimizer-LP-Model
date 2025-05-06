import React, { useState, useEffect } from 'react';
import csvData from './data/College_admission.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const COLLEGE_NAMES = {
  1: 'Top Tier University',
  2: 'High Tier University',
  3: 'Mid Tier University',
  4: 'Regular University'
};

const PRESTIGE_SCORES = {
  1: 1.0,
  2: 0.75,
  3: 0.5,
  4: 0.25
};

const STRATEGIES = {
  "risk-averse": { admission_prob: 0.9, prestige: 0.1 },
  "balanced": { admission_prob: 0.7, prestige: 0.3 },
  "prestige-focused": { admission_prob: 0.3, prestige: 0.7 }
};

// Helper to parse CSV string to array of objects
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = isNaN(values[i]) ? values[i] : Number(values[i]);
    });
    return obj;
  });
}

// Helper to calculate mean
function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Helper to calculate std deviation
function std(arr) {
  const m = mean(arr);
  return Math.sqrt(mean(arr.map(x => (x - m) ** 2)));
}

// Calculate summary statistics from CSV data
function getCollegeStats(data) {
  const stats = {};
  [1, 2, 3, 4].forEach(rank => {
    const rankData = data.filter(d => d.rank === rank);
    const admitted = rankData.filter(d => d.admit === 1);
    const admission_rate = admitted.length / rankData.length;
    const gpa_threshold = Math.min(...admitted.map(d => d.gpa));
    const gpa_admitted_mean = mean(admitted.map(d => d.gpa));
    const gpa_admitted_std = std(admitted.map(d => d.gpa));
    stats[rank] = {
      name: COLLEGE_NAMES[rank],
      admission_rate: admission_rate,
      gpa_threshold: gpa_threshold,
      gpa_admitted_mean: gpa_admitted_mean,
      gpa_admitted_std: gpa_admitted_std,
      prestige_score: PRESTIGE_SCORES[rank]
    };
  });
  return stats;
}

const App = () => {
  const [studentGpa, setStudentGpa] = useState(3.5);
  const [strategy, setStrategy] = useState("balanced");
  const [results, setResults] = useState([]);
  const [maxApplications, setMaxApplications] = useState(3);
  const [colleges, setColleges] = useState(null);

  // Parse CSV and calculate stats on mount
  useEffect(() => {
    const data = parseCSV(csvData);
    const stats = getCollegeStats(data);
    setColleges(stats);
  }, []);

  // Calculate admission probability for all colleges based on GPA
  const calculateAdmissionProbabilities = (gpa) => {
    const collegeWithProbs = {};

    for (const [rank, college] of Object.entries(colleges)) {
      let admissionProb;

      if (gpa >= college.gpa_threshold) {
        const zScore = (gpa - college.gpa_admitted_mean) / college.gpa_admitted_std;
        admissionProb = college.admission_rate * (1 + 0.1 * zScore);
        admissionProb = Math.min(admissionProb, 0.95); // Cap at 95%
      } else {
        const deficit = college.gpa_threshold - gpa;
        admissionProb = Math.max(0.05, college.admission_rate * (1 - deficit)); // Minimum 5%
      }

      collegeWithProbs[rank] = {
        ...college,
        admission_prob: admissionProb
      };
    }

    return collegeWithProbs;
  };

  // Solve the LP model (simplified greedy approach for the UI)
  const solveModel = (gpa, strategy, maxApps) => {
    const collegesWithProbs = calculateAdmissionProbabilities(gpa);
    const weights = STRATEGIES[strategy];

    // Calculate utility for each college
    const collegesWithUtility = Object.entries(collegesWithProbs).map(([rank, college]) => {
      const utility = weights.admission_prob * college.admission_prob +
                      weights.prestige * college.prestige_score;
      return {
        rank: parseInt(rank),
        name: college.name,
        admission_prob: college.admission_prob,
        prestige_score: college.prestige_score,
        utility
      };
    });

    // Sort by utility (descending)
    collegesWithUtility.sort((a, b) => b.utility - a.utility);

    // Select top N colleges based on max applications
    return collegesWithUtility.slice(0, maxApps);
  };

  // Update results when inputs or colleges change
  useEffect(() => {
    if (!colleges) return;
    const newResults = solveModel(studentGpa, strategy, maxApplications);
    setResults(newResults);
    // eslint-disable-next-line
  }, [studentGpa, strategy, maxApplications, colleges]);

  // Prepare data for bar chart
  const getChartData = () => {
    return results.map(college => ({
      name: `Rank ${college.rank}`,
      admissionProbability: parseFloat((college.admission_prob * 100).toFixed(1)),
      prestigeScore: parseFloat((college.prestige_score * 100).toFixed(1)),
      utility: parseFloat((college.utility * 100).toFixed(1))
    }));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">College Admission Optimizer (LP Model)</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="p-4 bg-gray-50 rounded">
          <h2 className="text-lg font-semibold mb-2">Student Profile</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">GPA (0-4.0)</label>
            <input
              type="range"
              min="2.0"
              max="4.0"
              step="0.05"
              value={studentGpa}
              onChange={(e) => setStudentGpa(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between">
              <span className="text-sm">2.0</span>
              <span className="font-medium">{studentGpa.toFixed(2)}</span>
              <span className="text-sm">4.0</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded">
          <h2 className="text-lg font-semibold mb-2">Strategy</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Application Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="risk-averse">Risk-Averse (90% admission, 10% prestige)</option>
              <option value="balanced">Balanced (70% admission, 30% prestige)</option>
              <option value="prestige-focused">Prestige-Focused (30% admission, 70% prestige)</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded">
          <h2 className="text-lg font-semibold mb-2">Constraints</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Maximum Applications</label>
            <input
              type="range"
              min="1"
              max="4"
              step="1"
              value={maxApplications}
              onChange={(e) => setMaxApplications(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between">
              <span className="text-sm">1</span>
              <span className="font-medium">{maxApplications}</span>
              <span className="text-sm">4</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Optimal College Choices</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission Probability</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prestige Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utility Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((college) => (
                <tr key={college.rank}>
                  <td className="px-6 py-4 whitespace-nowrap">{college.rank}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{college.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{(college.admission_prob * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">{(college.prestige_score * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">{(college.utility * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="h-64 mb-6">
        <h2 className="text-lg font-semibold mb-2">Comparative Analysis</h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="admissionProbability" name="Admission Probability (%)" fill="#8884d8" />
            <Bar dataKey="prestigeScore" name="Prestige Score (%)" fill="#82ca9d" />
            <Bar dataKey="utility" name="Utility Score (%)" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">LP Model Explanation</h2>
        <p className="mb-2">
          This interactive dashboard implements a simplified version of a Linear Programming (LP) model for optimizing college application strategies. The model:
        </p>
        <ul className="list-disc pl-6 mb-2 space-y-1">
          <li>Calculates admission probabilities based on your GPA relative to each college's threshold</li>
          <li>Applies weights based on your selected strategy (risk-averse, balanced, or prestige-focused)</li>
          <li>Computes a utility score for each college that combines admission probability and prestige</li>
          <li>Selects the top colleges that maximize your total utility while respecting your maximum application limit</li>
        </ul>
        <p>
          Adjust the sliders and dropdown to see how different GPA levels and strategies affect your optimal college choices.
        </p>
      </div>
    </div>
  );
};

export default App;