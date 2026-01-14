import React from 'react';
import { Card, CardContent } from './ui/card';
import GradeBadge from './GradeBadge';

const ScoreBar = ({ protocolScore = 0, keyExchangeScore = 0, cipherScore = 0, overallScore = 0, grade = '?' }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 65) return 'bg-green-400';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 35) return 'bg-orange-500';
    if (score >= 20) return 'bg-red-400';
    return 'bg-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 65) return 'bg-green-50';
    if (score >= 50) return 'bg-yellow-50';
    if (score >= 35) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const ScoreSection = ({ label, score, weight }) => (
    <div className={`flex-1 p-4 rounded-lg ${getScoreBgColor(score)}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-xs text-gray-400">{weight}%</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getScoreColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
        <span className="text-lg font-bold text-gray-700 w-12 text-right">{score}</span>
      </div>
    </div>
  );

  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Grade Section */}
          <div className="lg:w-48 bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-200">
            <GradeBadge grade={grade} size="xl" showLabel />
            <div className="mt-3 text-center">
              <div className="text-2xl font-bold text-gray-700">{overallScore}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Overall Score</div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="flex-1 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Score Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScoreSection label="Protocol Support" score={protocolScore} weight={30} />
              <ScoreSection label="Key Exchange" score={keyExchangeScore} weight={30} />
              <ScoreSection label="Cipher Strength" score={cipherScore} weight={40} />
            </div>

            {/* Formula explanation */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Final Score = (Protocol × 30%) + (Key Exchange × 30%) + (Cipher Strength × 40%)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreBar;
