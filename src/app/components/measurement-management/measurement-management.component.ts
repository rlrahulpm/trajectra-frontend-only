import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CorrosionDataService } from '../../services/corrosion-data.service';

@Component({
  selector: 'app-measurement-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="measurement-management">
      <h1>Measurement Management</h1>
      
      <div class="measurement-form">
        <h2>Add New Measurement</h2>
        <form (submit)="addMeasurement($event)">
          <div class="form-grid">
            <div class="form-group">
              <label>Select TML:</label>
              <select [(ngModel)]="newMeasurement.tmlRecordId" name="tmlRecordId" required>
                <option value="">Select a TML</option>
                <option *ngFor="let tml of tmls()" [value]="tml.id">
                  {{ tml.tmlId }} - {{ tml.circuitId }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Measurement Date:</label>
              <input type="date" [(ngModel)]="newMeasurement.measurementDate" name="measurementDate" required>
            </div>
            
            <div class="form-group">
              <label>Thickness (mm):</label>
              <input type="number" step="0.01" [(ngModel)]="newMeasurement.thickness" name="thickness" required>
            </div>
            
            <div class="form-group">
              <label>Corrosion Rate (mpy):</label>
              <input type="number" step="0.01" [(ngModel)]="newMeasurement.corrosionRate" name="corrosionRate" required>
            </div>
            
            <div class="form-group">
              <label>Temperature (°C):</label>
              <input type="number" step="0.1" [(ngModel)]="newMeasurement.temperature" name="temperature" required>
            </div>
          </div>
          
          <button type="submit" class="submit-btn">Add Measurement</button>
        </form>
      </div>

      <div class="recent-measurements">
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let measurement of measurements()">
                <td>{{ formatDate(measurement.measurementDate) }}</td>
                <td>{{ measurement.tmlId }}</td>
                <td>{{ measurement.circuitId }}</td>
                <td>{{ measurement.thickness }} mm</td>
                <td [class.high-risk]="measurement.corrosionRate > 50">
                  {{ measurement.corrosionRate }} mpy
                </td>
                <td>{{ measurement.temperature }}°C</td>
                <td>
                  <button (click)="deleteMeasurement(measurement.id)" class="delete-btn">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .measurement-management {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      color: #333;
      margin-bottom: 30px;
    }

    .measurement-form {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      margin-bottom: 5px;
      color: #666;
      font-weight: 500;
    }

    .form-group input,
    .form-group select {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 1rem;
    }

    .submit-btn {
      background: #667eea;
      color: white;
      padding: 12px 30px;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.3s;
    }

    .submit-btn:hover {
      background: #5a67d8;
    }

    .recent-measurements {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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

    .high-risk {
      color: #f56565;
      font-weight: bold;
    }

    .delete-btn {
      background: #f56565;
      color: white;
      padding: 5px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .delete-btn:hover {
      background: #e53e3e;
    }
  `]
})
export class MeasurementManagementComponent implements OnInit {
  measurements = signal<any[]>([]);
  tmls = signal<any[]>([]);
  
  newMeasurement = {
    tmlRecordId: '',
    measurementDate: new Date().toISOString().split('T')[0],
    thickness: null,
    corrosionRate: null,
    temperature: null
  };

  constructor(private corrosionService: CorrosionDataService) {}

  async ngOnInit() {
    await this.loadTmls();
    await this.loadMeasurements();
  }

  async loadTmls() {
    const tmls = await this.corrosionService.getAllTmls();
    this.tmls.set(tmls);
  }

  async loadMeasurements() {
    const measurements = await this.corrosionService.getMeasurements();
    const tmls = this.tmls();
    
    const measurementsWithTml = measurements.map(m => {
      const tml = tmls.find(t => t.id === m.tmlRecordId);
      return {
        ...m,
        tmlId: tml?.tmlId || 'Unknown',
        circuitId: tml?.circuitId || 'Unknown'
      };
    }).sort((a, b) => 
      new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
    ).slice(0, 20);
    
    this.measurements.set(measurementsWithTml);
  }

  async addMeasurement(event: Event) {
    event.preventDefault();
    
    try {
      await this.corrosionService.createMeasurement(this.newMeasurement);
      alert('Measurement added successfully!');
      
      // Reset form
      this.newMeasurement = {
        tmlRecordId: '',
        measurementDate: new Date().toISOString().split('T')[0],
        thickness: null,
        corrosionRate: null,
        temperature: null
      };
      
      // Reload measurements
      await this.loadMeasurements();
    } catch (error) {
      alert('Error adding measurement. Please try again.');
    }
  }

  async deleteMeasurement(id: number) {
    if (confirm('Are you sure you want to delete this measurement?')) {
      try {
        await this.corrosionService.deleteMeasurement(id);
        await this.loadMeasurements();
      } catch (error) {
        alert('Error deleting measurement.');
      }
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}