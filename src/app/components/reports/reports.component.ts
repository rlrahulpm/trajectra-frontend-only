import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CorrosionDataService } from '../../services/corrosion-data.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports">
      <h1>Reports & Export</h1>
      
      <div class="report-options">
        <div class="report-card">
          <h2>Complete System Report</h2>
          <p>Export all TML data, measurements, and analytics in a comprehensive report.</p>
          <button (click)="generateCompleteReport()" class="export-btn primary">
            Generate Complete Report
          </button>
        </div>

        <div class="report-card">
          <h2>Circuit Summary Report</h2>
          <p>Get a detailed summary of all circuits with their performance metrics.</p>
          <button (click)="generateCircuitReport()" class="export-btn success">
            Generate Circuit Report
          </button>
        </div>

        <div class="report-card">
          <h2>Risk Assessment Report</h2>
          <p>Export high-risk TMLs and critical areas requiring immediate attention.</p>
          <button (click)="generateRiskReport()" class="export-btn danger">
            Generate Risk Report
          </button>
        </div>

        <div class="report-card">
          <h2>Measurement History</h2>
          <p>Export complete measurement history for all TML points.</p>
          <button (click)="generateMeasurementReport()" class="export-btn info">
            Export Measurements
          </button>
        </div>
      </div>

      <div class="report-preview" *ngIf="reportPreview()">
        <h2>Report Preview</h2>
        <div class="preview-content">
          <pre>{{ reportPreview() }}</pre>
        </div>
        <button (click)="downloadReport()" class="download-btn">
          Download Report
        </button>
      </div>
    </div>
  `,
  styles: [`
    .reports {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      color: #333;
      margin-bottom: 30px;
    }

    .report-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .report-card {
      background: white;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transition: transform 0.3s ease;
    }

    .report-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    }

    .report-card h2 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 1.3rem;
    }

    .report-card p {
      color: #666;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .export-btn {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .export-btn.primary {
      background: #667eea;
    }

    .export-btn.primary:hover {
      background: #5a67d8;
    }

    .export-btn.success {
      background: #48bb78;
    }

    .export-btn.success:hover {
      background: #38a169;
    }

    .export-btn.danger {
      background: #f56565;
    }

    .export-btn.danger:hover {
      background: #e53e3e;
    }

    .export-btn.info {
      background: #4299e1;
    }

    .export-btn.info:hover {
      background: #3182ce;
    }

    .report-preview {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .report-preview h2 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .preview-content {
      background: #f7fafc;
      padding: 20px;
      border-radius: 5px;
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 20px;
    }

    .preview-content pre {
      margin: 0;
      font-family: monospace;
      font-size: 0.9rem;
      white-space: pre-wrap;
    }

    .download-btn {
      background: #667eea;
      color: white;
      padding: 12px 30px;
      border: none;
      border-radius: 5px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
    }

    .download-btn:hover {
      background: #5a67d8;
    }
  `]
})
export class ReportsComponent implements OnInit {
  reportPreview = signal<string>('');
  currentReportType = '';

  constructor(private corrosionService: CorrosionDataService) {}

  ngOnInit() {}

  async generateCompleteReport() {
    const tmls = await this.corrosionService.getAllTmls();
    const measurements = await this.corrosionService.getMeasurements();
    const stats = await this.corrosionService.getStatistics();

    const report = `
COMPLETE SYSTEM REPORT
Generated: ${new Date().toLocaleDateString()}
===============================================

SYSTEM OVERVIEW
---------------
Total TMLs: ${stats.totalTmls}
Total Circuits: ${stats.totalCircuits}
Total Measurements: ${stats.totalMeasurements}
Average Corrosion Rate: ${stats.avgCorrosionRate} mpy
Average Thickness: ${stats.avgThickness} mm
Latest Measurement: ${stats.latestMeasurementDate}

TML SUMMARY
-----------
${tmls.slice(0, 10).map(tml => 
  `TML ID: ${tml.tmlId} | Circuit: ${tml.circuitId}`
).join('\n')}

RECENT MEASUREMENTS
------------------
${measurements.slice(0, 10).map(m => 
  `Date: ${m.measurementDate} | Thickness: ${m.thickness}mm | Corrosion: ${m.corrosionRate}mpy`
).join('\n')}
`;

    this.reportPreview.set(report);
    this.currentReportType = 'complete';
  }

  async generateCircuitReport() {
    const circuits = await this.corrosionService.getCircuits();
    const tmls = await this.corrosionService.getAllTmls();
    const measurements = await this.corrosionService.getMeasurements();

    const circuitStats = circuits.map(circuit => {
      const circuitTmls = tmls.filter(t => t.circuitId === circuit);
      const circuitMeasurements = measurements.filter(m => 
        circuitTmls.some(t => t.id === m.tmlRecordId)
      );
      
      const avgCorrosion = circuitMeasurements.length > 0
        ? (circuitMeasurements.reduce((sum, m) => sum + (m.corrosionRate || 0), 0) / circuitMeasurements.length).toFixed(2)
        : 0;

      return `Circuit: ${circuit}
  TMLs: ${circuitTmls.length}
  Measurements: ${circuitMeasurements.length}
  Avg Corrosion: ${avgCorrosion} mpy`;
    });

    const report = `
CIRCUIT SUMMARY REPORT
Generated: ${new Date().toLocaleDateString()}
===============================================

CIRCUIT STATISTICS
------------------
Total Circuits: ${circuits.length}

CIRCUIT DETAILS
---------------
${circuitStats.join('\n\n')}
`;

    this.reportPreview.set(report);
    this.currentReportType = 'circuit';
  }

  async generateRiskReport() {
    const measurements = await this.corrosionService.getMeasurements();
    const tmls = await this.corrosionService.getAllTmls();

    // Get latest measurements for each TML
    const latestByTml = new Map();
    measurements.forEach(m => {
      if (!latestByTml.has(m.tmlRecordId) || 
          new Date(m.measurementDate) > new Date(latestByTml.get(m.tmlRecordId).measurementDate)) {
        latestByTml.set(m.tmlRecordId, m);
      }
    });

    const highRisk = Array.from(latestByTml.values())
      .filter(m => m.corrosionRate > 30)
      .map(m => {
        const tml = tmls.find(t => t.id === m.tmlRecordId);
        return {
          ...m,
          tmlId: tml?.tmlId || 'Unknown',
          circuitId: tml?.circuitId || 'Unknown'
        };
      })
      .sort((a, b) => b.corrosionRate - a.corrosionRate);

    const report = `
RISK ASSESSMENT REPORT
Generated: ${new Date().toLocaleDateString()}
===============================================

HIGH RISK TMLs (> 30 mpy)
--------------------------
Total High Risk: ${highRisk.length}

CRITICAL TMLs
-------------
${highRisk.slice(0, 20).map(tml => 
  `TML: ${tml.tmlId} | Circuit: ${tml.circuitId}
  Corrosion: ${tml.corrosionRate.toFixed(2)} mpy
  Thickness: ${tml.thickness.toFixed(2)} mm
  Last Measured: ${tml.measurementDate}`
).join('\n\n')}

RECOMMENDATIONS
---------------
- Immediate inspection required for critical TMLs
- Increase monitoring frequency for high-risk areas
- Consider preventive maintenance for affected circuits
`;

    this.reportPreview.set(report);
    this.currentReportType = 'risk';
  }

  async generateMeasurementReport() {
    const measurements = await this.corrosionService.getMeasurements();
    const tmls = await this.corrosionService.getAllTmls();

    const measurementsWithTml = measurements.slice(0, 50).map(m => {
      const tml = tmls.find(t => t.id === m.tmlRecordId);
      return {
        ...m,
        tmlId: tml?.tmlId || 'Unknown',
        circuitId: tml?.circuitId || 'Unknown'
      };
    });

    const report = `
MEASUREMENT HISTORY REPORT
Generated: ${new Date().toLocaleDateString()}
===============================================

MEASUREMENT RECORDS
-------------------
Total Records: ${measurements.length}

DETAILED MEASUREMENTS
--------------------
Date,TML ID,Circuit,Thickness(mm),Corrosion(mpy),Temperature(°C)
${measurementsWithTml.map(m => 
  `${m.measurementDate},${m.tmlId},${m.circuitId},${m.thickness},${m.corrosionRate},${m.temperature}`
).join('\n')}
`;

    this.reportPreview.set(report);
    this.currentReportType = 'measurement';
  }

  downloadReport() {
    const content = this.reportPreview();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentReportType}_report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}