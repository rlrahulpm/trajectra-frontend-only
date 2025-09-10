import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CorrosionDataService } from '../../services/corrosion-data.service';

@Component({
  selector: 'app-classification-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="classification-management">
      <h1>Classification Management</h1>
      
      <div class="classifications-grid">
        <div class="classification-card">
          <h2>Corrosion Rate Classifications</h2>
          <table>
            <thead>
              <tr>
                <th>Range Label</th>
                <th>Min Value (mpy)</th>
                <th>Max Value (mpy)</th>
                <th>Color</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let classification of corrosionClassifications()">
                <td>{{ classification.rangeLabel }}</td>
                <td>{{ classification.minValue }}</td>
                <td>{{ classification.maxValue || '∞' }}</td>
                <td>
                  <span class="color-badge" [style.background]="getColorForRange(classification.rangeLabel)"></span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="classification-card">
          <h2>Thickness Classifications</h2>
          <table>
            <thead>
              <tr>
                <th>Range Label</th>
                <th>Min Value (mm)</th>
                <th>Max Value (mm)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let classification of thicknessClassifications()">
                <td>{{ classification.rangeLabel }}</td>
                <td>{{ classification.minValue }}</td>
                <td>{{ classification.maxValue || '∞' }}</td>
                <td>
                  <span class="status-badge" [class]="classification.rangeLabel.toLowerCase()">
                    {{ classification.rangeLabel }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="info-section">
        <h2>Classification Information</h2>
        <p>These classifications are used throughout the system to categorize and assess the condition of TML points based on their corrosion rates and thickness measurements.</p>
        <ul>
          <li><strong>Corrosion Rate:</strong> Measured in mils per year (mpy), indicates the rate at which material is being lost due to corrosion.</li>
          <li><strong>Thickness:</strong> Measured in millimeters (mm), represents the current thickness of the material at the TML point.</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .classification-management {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      color: #333;
      margin-bottom: 30px;
    }

    .classifications-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .classification-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .classification-card h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 1.3rem;
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

    .color-badge {
      display: inline-block;
      width: 30px;
      height: 20px;
      border-radius: 4px;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.critical {
      background: #feb2b2;
      color: #742a2a;
    }

    .status-badge.warning {
      background: #fed7aa;
      color: #7c2d12;
    }

    .status-badge.acceptable {
      background: #fef3c7;
      color: #78350f;
    }

    .status-badge.good {
      background: #c6f6d5;
      color: #22543d;
    }

    .info-section {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .info-section h2 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .info-section p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 15px;
    }

    .info-section ul {
      color: #666;
      line-height: 1.8;
    }

    .info-section strong {
      color: #333;
    }
  `]
})
export class ClassificationManagementComponent implements OnInit {
  corrosionClassifications = signal<any[]>([]);
  thicknessClassifications = signal<any[]>([]);

  constructor(private corrosionService: CorrosionDataService) {}

  async ngOnInit() {
    await this.loadClassifications();
  }

  async loadClassifications() {
    const classifications = await this.corrosionService.getClassifications();
    
    const corrosion = classifications.filter(c => c.classificationType === 'CORROSION_RATE');
    const thickness = classifications.filter(c => c.classificationType === 'THICKNESS');
    
    this.corrosionClassifications.set(corrosion);
    this.thicknessClassifications.set(thickness);
  }

  getColorForRange(rangeLabel: string): string {
    const colorMap: { [key: string]: string } = {
      'Low': '#48bb78',
      'Moderate': '#ed8936',
      'High': '#f56565',
      'Severe': '#9f1239',
      'Critical': '#450a0a'
    };
    return colorMap[rangeLabel] || '#718096';
  }
}