import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CorrosionDataService } from '../../services/corrosion-data.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <h1>Dashboard Overview</h1>
      
      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-icon">📍</div>
          <div class="stat-content">
            <h3>Total TMLs</h3>
            <p class="stat-value">{{ statistics().totalTmls }}</p>
          </div>
        </div>
        
        <div class="stat-card success">
          <div class="stat-icon">🔌</div>
          <div class="stat-content">
            <h3>Total Circuits</h3>
            <p class="stat-value">{{ statistics().totalCircuits }}</p>
          </div>
        </div>
        
        <div class="stat-card info">
          <div class="stat-icon">📏</div>
          <div class="stat-content">
            <h3>Total Measurements</h3>
            <p class="stat-value">{{ statistics().totalMeasurements }}</p>
          </div>
        </div>
        
        <div class="stat-card warning">
          <div class="stat-icon">⚡</div>
          <div class="stat-content">
            <h3>Avg Corrosion Rate</h3>
            <p class="stat-value">{{ statistics().avgCorrosionRate }} mpy</p>
          </div>
        </div>
        
        <div class="stat-card danger">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <h3>Avg Thickness</h3>
            <p class="stat-value">{{ statistics().avgThickness }} mm</p>
          </div>
        </div>
        
        <div class="stat-card secondary">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <h3>Latest Measurement</h3>
            <p class="stat-value">{{ formatDate(statistics().latestMeasurementDate) }}</p>
          </div>
        </div>
      </div>

      <div class="recent-section">
        <div class="section-card">
          <h2>Recent Measurements</h2>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>TML ID</th>
                  <th>Circuit</th>
                  <th>Thickness</th>
                  <th>Corrosion Rate</th>
                  <th>Temperature</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let measurement of recentMeasurements()">
                  <td>{{ formatDate(measurement.measurementDate) }}</td>
                  <td>{{ measurement.tmlId || 'N/A' }}</td>
                  <td>{{ measurement.circuitId || 'N/A' }}</td>
                  <td>{{ measurement.thickness }} mm</td>
                  <td [class.high-risk]="measurement.corrosionRate > 50">
                    {{ measurement.corrosionRate }} mpy
                  </td>
                  <td>{{ measurement.temperature }}°C</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="section-card">
          <h2>Risk Distribution</h2>
          <div class="risk-distribution">
            <div class="risk-item" *ngFor="let risk of riskDistribution()">
              <div class="risk-bar" [style.width.%]="risk.percentage" [class]="risk.className">
                <span class="risk-label">{{ risk.label }}</span>
              </div>
              <span class="risk-count">{{ risk.count }} TMLs ({{ risk.percentage }}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="action-buttons">
          <a routerLink="/measurements" class="action-btn primary">
            <span class="icon">➕</span>
            Add Measurement
          </a>
          <a routerLink="/tmls" class="action-btn success">
            <span class="icon">📍</span>
            Manage TMLs
          </a>
          <a routerLink="/analytics" class="action-btn info">
            <span class="icon">📈</span>
            View Analytics
          </a>
          <a routerLink="/reports" class="action-btn warning">
            <span class="icon">📑</span>
            Generate Report
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }

    h1 {
      color: #333;
      margin-bottom: 30px;
      font-size: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      transition: transform 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    }

    .stat-card.primary { border-left: 4px solid #667eea; }
    .stat-card.success { border-left: 4px solid #48bb78; }
    .stat-card.info { border-left: 4px solid #4299e1; }
    .stat-card.warning { border-left: 4px solid #ed8936; }
    .stat-card.danger { border-left: 4px solid #f56565; }
    .stat-card.secondary { border-left: 4px solid #718096; }

    .stat-icon {
      font-size: 2.5rem;
      margin-right: 20px;
    }

    .stat-content h3 {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .stat-value {
      margin: 5px 0 0 0;
      font-size: 1.8rem;
      font-weight: bold;
      color: #333;
    }

    .recent-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 40px;
    }

    .section-card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .section-card h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 1.4rem;
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      background: #f7fafc;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #666;
      border-bottom: 2px solid #e2e8f0;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    tr:hover {
      background: #f7fafc;
    }

    .high-risk {
      color: #f56565;
      font-weight: bold;
    }

    .risk-distribution {
      margin-top: 20px;
    }

    .risk-item {
      margin-bottom: 15px;
    }

    .risk-bar {
      background: #e2e8f0;
      border-radius: 5px;
      padding: 8px 12px;
      margin-bottom: 5px;
      transition: all 0.3s ease;
    }

    .risk-bar.low { background: #48bb78; color: white; }
    .risk-bar.moderate { background: #ed8936; color: white; }
    .risk-bar.high { background: #f56565; color: white; }
    .risk-bar.severe { background: #9f1239; color: white; }
    .risk-bar.critical { background: #450a0a; color: white; }

    .risk-label {
      font-weight: 600;
    }

    .risk-count {
      font-size: 0.9rem;
      color: #666;
      margin-left: 10px;
    }

    .quick-actions {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .quick-actions h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 1.4rem;
    }

    .action-buttons {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      padding: 12px 20px;
      border-radius: 8px;
      text-decoration: none;
      color: white;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }

    .action-btn.primary { background: #667eea; }
    .action-btn.success { background: #48bb78; }
    .action-btn.info { background: #4299e1; }
    .action-btn.warning { background: #ed8936; }

    .action-btn .icon {
      margin-right: 8px;
      font-size: 1.2rem;
    }

    @media (max-width: 768px) {
      .recent-section {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  statistics = signal({
    totalMeasurements: 0,
    totalTmls: 0,
    totalCircuits: 0,
    avgCorrosionRate: '0',
    avgThickness: '0',
    latestMeasurementDate: new Date().toISOString().split('T')[0]
  });

  recentMeasurements = signal<any[]>([]);
  riskDistribution = signal<any[]>([]);

  constructor(private corrosionService: CorrosionDataService) {}

  async ngOnInit() {
    await this.loadStatistics();
    await this.loadRecentMeasurements();
    await this.calculateRiskDistribution();
  }

  async loadStatistics() {
    const stats = await this.corrosionService.getStatistics();
    this.statistics.set(stats);
  }

  async loadRecentMeasurements() {
    const measurements = await this.corrosionService.getMeasurements();
    const tmls = await this.corrosionService.getAllTmls();
    
    // Map TML data to measurements
    const measurementsWithTml = measurements.map(m => {
      const tml = tmls.find(t => t.id === m.tmlRecordId);
      return {
        ...m,
        tmlId: tml?.tmlId || 'Unknown',
        circuitId: tml?.circuitId || 'Unknown'
      };
    });

    // Sort by date and take the most recent 10
    const sorted = measurementsWithTml.sort((a, b) => 
      new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
    );
    
    this.recentMeasurements.set(sorted.slice(0, 10));
  }

  async calculateRiskDistribution() {
    const measurements = await this.corrosionService.getMeasurements();
    
    // Group latest measurements by TML
    const latestByTml = new Map();
    measurements.forEach(m => {
      if (!latestByTml.has(m.tmlRecordId) || 
          new Date(m.measurementDate) > new Date(latestByTml.get(m.tmlRecordId).measurementDate)) {
        latestByTml.set(m.tmlRecordId, m);
      }
    });

    // Calculate risk distribution
    const riskCategories = {
      low: { label: 'Low (< 10 mpy)', count: 0, className: 'low' },
      moderate: { label: 'Moderate (10-25 mpy)', count: 0, className: 'moderate' },
      high: { label: 'High (25-50 mpy)', count: 0, className: 'high' },
      severe: { label: 'Severe (50-100 mpy)', count: 0, className: 'severe' },
      critical: { label: 'Critical (> 100 mpy)', count: 0, className: 'critical' }
    };

    latestByTml.forEach((m) => {
      const rate = m.corrosionRate || 0;
      if (rate < 10) riskCategories.low.count++;
      else if (rate < 25) riskCategories.moderate.count++;
      else if (rate < 50) riskCategories.high.count++;
      else if (rate < 100) riskCategories.severe.count++;
      else riskCategories.critical.count++;
    });

    const total = latestByTml.size || 1;
    const distribution = Object.values(riskCategories).map(cat => ({
      ...cat,
      percentage: Math.round((cat.count / total) * 100)
    }));

    this.riskDistribution.set(distribution);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}