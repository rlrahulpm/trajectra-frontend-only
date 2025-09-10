import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CorrosionDataService } from '../../services/corrosion-data.service';

@Component({
  selector: 'app-circuit-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="circuit-management">
      <div class="header">
        <h1>Circuit Management</h1>
        <div class="header-actions">
          <input 
            type="text" 
            [(ngModel)]="searchTerm"
            (input)="filterCircuits()"
            placeholder="Search circuits..." 
            class="search-input">
        </div>
      </div>

      <div class="circuits-grid">
        <div class="circuit-card" *ngFor="let circuit of filteredCircuits()">
          <div class="circuit-header">
            <h3>{{ circuit.name }}</h3>
            <span class="tml-count">{{ circuit.tmlCount }} TMLs</span>
          </div>
          
          <div class="circuit-stats">
            <div class="stat">
              <label>Avg Corrosion Rate:</label>
              <span [class.high-value]="circuit.avgCorrosionRate > 30">
                {{ circuit.avgCorrosionRate.toFixed(2) }} mpy
              </span>
            </div>
            <div class="stat">
              <label>Avg Thickness:</label>
              <span>{{ circuit.avgThickness.toFixed(2) }} mm</span>
            </div>
            <div class="stat">
              <label>Latest Measurement:</label>
              <span>{{ formatDate(circuit.latestMeasurement) }}</span>
            </div>
          </div>

          <div class="risk-indicator" [class]="circuit.riskLevel">
            Risk Level: {{ circuit.riskLevel }}
          </div>

          <div class="circuit-actions">
            <button (click)="viewCircuitDetails(circuit)" class="btn btn-primary">
              View Details
            </button>
            <button (click)="exportCircuitData(circuit)" class="btn btn-secondary">
              Export Data
            </button>
          </div>

          <div class="tml-list" *ngIf="expandedCircuit() === circuit.name">
            <h4>TML Points in {{ circuit.name }}</h4>
            <table>
              <thead>
                <tr>
                  <th>TML ID</th>
                  <th>Latest Thickness</th>
                  <th>Corrosion Rate</th>
                  <th>Temperature</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tml of circuit.tmls">
                  <td>{{ tml.tmlId }}</td>
                  <td>{{ tml.latestThickness?.toFixed(2) || 'N/A' }} mm</td>
                  <td [class.high-value]="tml.latestCorrosionRate > 30">
                    {{ tml.latestCorrosionRate?.toFixed(2) || 'N/A' }} mpy
                  </td>
                  <td>{{ tml.latestTemperature?.toFixed(1) || 'N/A' }}°C</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="summary-section">
        <h2>Circuit Summary</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Circuits</h3>
            <p class="summary-value">{{ circuits().length }}</p>
          </div>
          <div class="summary-card">
            <h3>High Risk Circuits</h3>
            <p class="summary-value danger">{{ getHighRiskCount() }}</p>
          </div>
          <div class="summary-card">
            <h3>Total TMLs</h3>
            <p class="summary-value">{{ getTotalTmlCount() }}</p>
          </div>
          <div class="summary-card">
            <h3>Avg Corrosion Rate</h3>
            <p class="summary-value">{{ getOverallAvgCorrosion().toFixed(2) }} mpy</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .circuit-management {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    h1 {
      color: #333;
      font-size: 2rem;
      margin: 0;
    }

    .search-input {
      padding: 10px 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      width: 300px;
      font-size: 1rem;
    }

    .search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .circuits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .circuit-card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transition: transform 0.3s ease;
    }

    .circuit-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    }

    .circuit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 2px solid #f0f0f0;
    }

    .circuit-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.2rem;
    }

    .tml-count {
      background: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .circuit-stats {
      margin-bottom: 15px;
    }

    .stat {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      padding: 5px 0;
    }

    .stat label {
      color: #666;
      font-size: 0.9rem;
    }

    .stat span {
      font-weight: 600;
      color: #333;
    }

    .high-value {
      color: #f56565 !important;
    }

    .risk-indicator {
      padding: 8px;
      border-radius: 5px;
      text-align: center;
      font-weight: 600;
      margin-bottom: 15px;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 1px;
    }

    .risk-indicator.low {
      background: #c6f6d5;
      color: #22543d;
    }

    .risk-indicator.moderate {
      background: #fed7aa;
      color: #7c2d12;
    }

    .risk-indicator.high {
      background: #feb2b2;
      color: #742a2a;
    }

    .circuit-actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a67d8;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }

    .btn-secondary:hover {
      background: #cbd5e0;
    }

    .tml-list {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #f0f0f0;
    }

    .tml-list h4 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .tml-list table {
      width: 100%;
      border-collapse: collapse;
    }

    .tml-list th {
      background: #f7fafc;
      padding: 8px;
      text-align: left;
      font-size: 0.85rem;
      color: #666;
      border-bottom: 2px solid #e2e8f0;
    }

    .tml-list td {
      padding: 8px;
      font-size: 0.9rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .summary-section {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .summary-section h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 1.5rem;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .summary-card {
      text-align: center;
      padding: 20px;
      background: #f7fafc;
      border-radius: 8px;
    }

    .summary-card h3 {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .summary-value {
      margin: 0;
      font-size: 2rem;
      font-weight: bold;
      color: #333;
    }

    .summary-value.danger {
      color: #f56565;
    }
  `]
})
export class CircuitManagementComponent implements OnInit {
  circuits = signal<any[]>([]);
  filteredCircuits = signal<any[]>([]);
  expandedCircuit = signal<string | null>(null);
  searchTerm = '';

  constructor(private corrosionService: CorrosionDataService) {}

  async ngOnInit() {
    await this.loadCircuits();
  }

  async loadCircuits() {
    const circuitNames = await this.corrosionService.getCircuits();
    const allTmls = await this.corrosionService.getAllTmls();
    const measurements = await this.corrosionService.getMeasurements();

    const circuitData = await Promise.all(circuitNames.map(async (circuitName) => {
      const circuitTmls = allTmls.filter(tml => tml.circuitId === circuitName);
      
      // Get latest measurements for each TML
      const tmlsWithMeasurements = circuitTmls.map(tml => {
        const tmlMeasurements = measurements.filter(m => m.tmlRecordId === tml.id);
        const latestMeasurement = tmlMeasurements.sort((a, b) => 
          new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
        )[0];

        return {
          ...tml,
          latestThickness: latestMeasurement?.thickness,
          latestCorrosionRate: latestMeasurement?.corrosionRate,
          latestTemperature: latestMeasurement?.temperature,
          latestMeasurementDate: latestMeasurement?.measurementDate
        };
      });

      // Calculate circuit statistics
      const avgCorrosionRate = tmlsWithMeasurements.reduce((sum, tml) => 
        sum + (tml.latestCorrosionRate || 0), 0) / (tmlsWithMeasurements.length || 1);
      
      const avgThickness = tmlsWithMeasurements.reduce((sum, tml) => 
        sum + (tml.latestThickness || 0), 0) / (tmlsWithMeasurements.length || 1);

      const latestDate = tmlsWithMeasurements.reduce((latest, tml) => {
        if (!tml.latestMeasurementDate) return latest;
        const tmlDate = new Date(tml.latestMeasurementDate);
        return !latest || tmlDate > latest ? tmlDate : latest;
      }, null as Date | null);

      // Determine risk level
      let riskLevel = 'low';
      if (avgCorrosionRate > 50) riskLevel = 'high';
      else if (avgCorrosionRate > 25) riskLevel = 'moderate';

      return {
        name: circuitName,
        tmlCount: circuitTmls.length,
        tmls: tmlsWithMeasurements,
        avgCorrosionRate,
        avgThickness,
        latestMeasurement: latestDate?.toISOString() || null,
        riskLevel
      };
    }));

    this.circuits.set(circuitData);
    this.filteredCircuits.set(circuitData);
  }

  filterCircuits() {
    const term = this.searchTerm.toLowerCase();
    const filtered = this.circuits().filter(circuit => 
      circuit.name.toLowerCase().includes(term)
    );
    this.filteredCircuits.set(filtered);
  }

  viewCircuitDetails(circuit: any) {
    if (this.expandedCircuit() === circuit.name) {
      this.expandedCircuit.set(null);
    } else {
      this.expandedCircuit.set(circuit.name);
    }
  }

  exportCircuitData(circuit: any) {
    const csvContent = this.generateCircuitCsv(circuit);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${circuit.name}_data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  generateCircuitCsv(circuit: any): string {
    const headers = ['TML ID', 'Latest Thickness (mm)', 'Corrosion Rate (mpy)', 'Temperature (°C)', 'Measurement Date'];
    const rows = circuit.tmls.map((tml: any) => [
      tml.tmlId,
      tml.latestThickness?.toFixed(2) || 'N/A',
      tml.latestCorrosionRate?.toFixed(2) || 'N/A',
      tml.latestTemperature?.toFixed(1) || 'N/A',
      tml.latestMeasurementDate || 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  getHighRiskCount(): number {
    return this.circuits().filter(c => c.riskLevel === 'high').length;
  }

  getTotalTmlCount(): number {
    return this.circuits().reduce((sum, c) => sum + c.tmlCount, 0);
  }

  getOverallAvgCorrosion(): number {
    const circuits = this.circuits();
    if (circuits.length === 0) return 0;
    return circuits.reduce((sum, c) => sum + c.avgCorrosionRate, 0) / circuits.length;
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}