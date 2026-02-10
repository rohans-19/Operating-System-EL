import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [code, setCode] = useState(`#include <sys/ptrace.h>
#include <stdio.h>

int main() {
    int n;
    while(1){
    }
}
`);
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [verdict, setVerdict] = useState('');
  const [riskScore, setRiskScore] = useState(null);
  const [seccompInfo, setSeccompInfo] = useState([]);
  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        fetchOutput();
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const parseSeccompAndVerdict = (text) => {
    const lines = text.split('\n');
    const syscalls = [];
    let detectedVerdict = '';
    let detectedRiskScore = null;

    lines.forEach(line => {
      // Parse SYSCALL lines
      if (line.includes('[SYSCALL]')) {
        const match = line.match(/\[SYSCALL\]\s+(\d+)\s+\(([^)]+)\)/);
        if (match) {
          syscalls.push({ number: match[1], name: match[2] });
        }
      }

      // Parse RISK_SCORE
      if (line.includes('[RISK_SCORE]') || line.includes('[RISK SCORE]')) {
        const scoreMatch = line.match(/\[RISK[\s_]SCORE\]\s+(\d+)/i);
        if (scoreMatch) {
          detectedRiskScore = parseInt(scoreMatch[1]);
        }
      }

      // Parse VERDICT
      if (line.includes('[VERDICT]')) {
        const verdictMatch = line.match(/\[VERDICT\]\s+(\w+)/i);
        if (verdictMatch) {
          detectedVerdict = verdictMatch[1].toUpperCase();
        }
      }

      // Fallback verdict detection
      if (!detectedVerdict) {
        if (line.includes('Bad system call')) {
          detectedVerdict = 'BLOCKED BY SECCOMP';
        } else if (line.includes('Segmentation fault')) {
          detectedVerdict = 'SEGMENTATION FAULT';
        } else if (line.includes('COMPILATION ERROR')) {
          detectedVerdict = 'COMPILATION ERROR';
        }
      }
    });

    return { syscalls, detectedVerdict, detectedRiskScore };
  };

  const fetchOutput = async () => {
    try {
      const response = await fetch('http://localhost:5000/stdout');
      const data = await response.json();

      setOutput(prev => prev + data.output);

      const { syscalls, detectedVerdict, detectedRiskScore } = parseSeccompAndVerdict(data.output);

      if (syscalls.length > 0) {
        setSeccompInfo(prev => {
          const newSyscalls = syscalls.filter(
            sc => !prev.some(p => p.number === sc.number && p.name === sc.name)
          );
          return [...prev, ...newSyscalls];
        });
      }

      if (detectedVerdict) {
        setVerdict(detectedVerdict);
      }

      if (detectedRiskScore !== null) {
        setRiskScore(detectedRiskScore);
      }

      if (data.status === 'FINISHED') {
        setIsRunning(false);
        if (!detectedVerdict && !verdict) {
          setVerdict('EXECUTION COMPLETED');
        }
      }
    } catch (error) {
      console.error('Error fetching output:', error);
    }
  };

  const runCode = async () => {
    setOutput('');
    setVerdict('');
    setRiskScore(null);
    setSeccompInfo([]);
    setIsRunning(true);

    try {
      const response = await fetch('http://localhost:5000/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.status === 'COMPILATION ERROR') {
        setOutput(data.output);
        setVerdict('COMPILATION ERROR');
        setIsRunning(false);
      }
    } catch (error) {
      setOutput('Error: ' + error.message);
      setIsRunning(false);
    }
  };

  const sendInput = async () => {
    if (!input.trim()) return;

    try {
      await fetch('http://localhost:5000/stdin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });
      setInput('');
    } catch (error) {
      console.error('Error sending input:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendInput();
    }
  };

  const getRiskColor = (score) => {
    if (score >= 95) return '#e03131';
    if (score >= 50) return '#ff922b';
    if (score >= 30) return '#fcc419';
    return '#51cf66';
  };

  const getVerdictColor = (v) => {
    if (v === 'MALICIOUS' || v === 'BLOCKED BY SECCOMP') return '#e03131';
    if (v === 'SUSPICIOUS') return '#ff922b';
    if (v === 'SAFE' || v === 'EXECUTION COMPLETED') return '#51cf66';
    if (v === 'COMPILATION ERROR') return '#ff922b';
    return '#868e96';
  };

  return (
    <div className="App">
      <header className="header">
        <h1>Sandboxed Program Runner</h1>
        <p className="subtitle">Secure C Code Execution with Seccomp</p>
      </header>

      <div className="container">
        <div className="editor-section">
          <div className="section-header">
            <h2>Code Editor</h2>
          </div>
          <textarea
            className="code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck="false"
          />
          <button 
            className="compile-btn" 
            onClick={runCode}
            disabled={isRunning}
          >
            {isRunning ? 'Running...' : 'Compile & Run'}
          </button>
        </div>

        <div className="output-section">
          <div className="section-header">
            <h2>Output</h2>
          </div>

          {/* Risk Score and Verdict Blocks */}
          {(riskScore !== null || verdict) && (
            <div className="analysis-blocks">
              {riskScore !== null && (
                <div className="analysis-card risk-card" style={{ borderLeftColor: getRiskColor(riskScore) }}>
                  <div className="card-label">Risk Score</div>
                  <div className="card-value" style={{ color: getRiskColor(riskScore) }}>
                    {riskScore}
                    <span className="score-max"></span>
                  </div>
                  <div className="risk-bar">
                    <div 
                      className="risk-bar-fill" 
                      style={{ 
                        width: `${riskScore}%`,
                        background: getRiskColor(riskScore)
                      }}
                    />
                  </div>
                </div>
              )}

              {verdict && (
                <div className="analysis-card verdict-card" style={{ borderLeftColor: getVerdictColor(verdict) }}>
                  <div className="card-label">Verdict</div>
                  <div className="card-value" style={{ color: getVerdictColor(verdict) }}>
                    {verdict}
                  </div>
                  <div className="verdict-icon">
                    {(verdict === 'MALICIOUS' || verdict === 'BLOCKED BY SECCOMP') && '⚠️'}
                    {verdict === 'SUSPICIOUS' && '⚡'}
                    {(verdict === 'SAFE' || verdict === 'EXECUTION COMPLETED') && '✓'}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="output-box" ref={outputRef}>
            <pre>{output || 'Output will appear here...'}</pre>
          </div>

          {seccompInfo.length > 0 && (
            <div className="seccomp-info">
              <h3>Syscalls Detected ({seccompInfo.length})</h3>
              <div className="syscall-list">
                {seccompInfo.map((sc, idx) => (
                  <span key={idx} className="syscall-tag">
                    {sc.name} ({sc.number})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="input-section">
            <h3>Input (stdin)</h3>
            <div className="input-group">
              <input
                type="text"
                className="input-field"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type input and press Enter"
                disabled={!isRunning}
              />
              <button 
                className="send-btn" 
                onClick={sendInput}
                disabled={!isRunning}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
