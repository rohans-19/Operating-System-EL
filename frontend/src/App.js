import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [code, setCode] = useState(`#include <sys/ptrace.h>
#include <stdio.h>

int main() {
    printf("Hello World\\n");
    return 0;
}
`);
  // output is now used as a temporary buffer or raw stream if needed, but we focus on userOutput/systemLogs
  const [output, setOutput] = useState('');
  const [userOutput, setUserOutput] = useState('');
  const [systemLogs, setSystemLogs] = useState('');

  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [verdict, setVerdict] = useState('');
  const [riskScore, setRiskScore] = useState(null);
  const [seccompInfo, setSeccompInfo] = useState([]);

  const userOutputRef = useRef(null);
  const systemLogsRef = useRef(null);

  // Auto-scroll for user output
  useEffect(() => {
    if (userOutputRef.current) {
      userOutputRef.current.scrollTop = userOutputRef.current.scrollHeight;
    }
  }, [userOutput]);

  // Auto-scroll for system logs
  useEffect(() => {
    if (systemLogsRef.current) {
      systemLogsRef.current.scrollTop = systemLogsRef.current.scrollHeight;
    }
  }, [systemLogs]);

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

      let currentDetectedVerdict = '';

      if (data.output) {
        setOutput(prev => prev + data.output);

        // Split output into user output and system logs
        const lines = data.output.split('\n');
        let newUserOutput = '';
        let newSystemLogs = '';

        lines.forEach(line => {
          if (!line) return;

          if (line.trim().startsWith('[')) {
            newSystemLogs += line + '\n';
          } else {
            newUserOutput += line + '\n';
          }
        });

        setUserOutput(prev => prev + newUserOutput);
        setSystemLogs(prev => prev + newSystemLogs);

        const { syscalls, detectedVerdict, detectedRiskScore } = parseSeccompAndVerdict(newSystemLogs);

        currentDetectedVerdict = detectedVerdict;

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
      }

      if (data.status === 'FINISHED') {
        setIsRunning(false);
        if (!currentDetectedVerdict && !verdict) {
          setVerdict('EXECUTION COMPLETED');
        }
      }
    } catch (error) {
      console.error('Error fetching output:', error);
    }
  };

  const runCode = async () => {
    setOutput('');
    setUserOutput('');
    setSystemLogs('');
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
        setSystemLogs(data.output);
        setVerdict('COMPILATION ERROR');
        setIsRunning(false);
      }
    } catch (error) {
      setSystemLogs('Error: ' + error.message);
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
            <h2>Program Output</h2>
          </div>
          <div className="output-box user-output-box" ref={userOutputRef}>
            <pre>{userOutput || 'Program output will appear here...'}</pre>
          </div>

          <div className="input-section" style={{ marginTop: '20px', marginBottom: '20px' }}>
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
                    {(verdict === 'MALICIOUS' || verdict === 'BLOCKED BY SECCOMP') && ' '}
                    {verdict === 'SUSPICIOUS' && ' '}
                    {(verdict === 'SAFE' || verdict === 'EXECUTION COMPLETED') && ' '}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="section-header" style={{ marginTop: '20px' }}>
            <h2>System Logs</h2>
          </div>

          <div className="output-box system-logs-box" ref={systemLogsRef} style={{ marginTop: '0px' }}>
            <pre>{systemLogs || 'System logs will appear here...'}</pre>
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
        </div>
      </div>
    </div>
  );
}

export default App;
