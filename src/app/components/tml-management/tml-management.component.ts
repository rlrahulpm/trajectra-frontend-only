import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CorrosionDataService } from '../../services/corrosion-data.service';

@Component({
  selector: 'app-tml-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tml-management">
      <div class="header">
        <h1>TML Points Management</h1>
        <div class="header-actions">
          <select [(ngModel)]="selectedCircuitFilter" (change)="filterTmls()" class="filter-select">
            <option value="">All Circuits</option>
            <option *ngFor="let circuit of circuits()" [value]="circuit">{{ circuit }}</option>
          </select>
          <input 
            type="text" 
            [(ngModel)]="searchTerm"
            (input)="filterTmls()"
            placeholder="Search TML ID..." 
            class="search-input">
        </div>
      </div>

      <div class="tml-table-container">
        <table class="tml-table">
          <thead>
            <tr>
              <th (click)="sortBy('tmlId')">
                TML ID
                <span class="sort-indicator" *ngIf="sortField === 'tmlId'">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th (click)="sortBy('circuitId')">
                Circuit
                <span class="sort-indicator" *ngIf="sortField === 'circuitId'">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th (click)="sortBy('latestThickness')">
                Latest Thickness
                <span class="sort-indicator" *ngIf="sortField === 'latestThickness'">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th (click)="sortBy('latestCorrosionRate')">
                Corrosion Rate
                <span class="sort-indicator" *ngIf="sortField === 'latestCorrosionRate'">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th (click)="sortBy('latestTemperature')">
                Temperature
                <span class="sort-indicator" *ngIf="sortField === 'latestTemperature'">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th (click)="sortBy('measurementDate')">
                Last Measured
                <span class="sort-indicator" *ngIf="sortField === 'measurementDate'">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th>Risk Level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let tml of paginatedTmls()">
              <td class="tml-id">{{ tml.tmlId }}</td>
              <td>{{ tml.circuitId }}</td>
              <td>{{ tml.latestThickness?.toFixed(2) || 'N/A' }} mm</td>
              <td [class.high-risk]="tml.latestCorrosionRate > 50">
                {{ tml.latestCorrosionRate?.toFixed(2) || 'N/A' }} mpy
              </td>
              <td>{{ tml.latestTemperature?.toFixed(1) || 'N/A' }}°C</td>
              <td>{{ formatDate(tml.measurementDate) }}</td>
              <td>
                <span class="risk-badge" [class]="tml.riskLevel">
                  {{ tml.riskLevel }}
                </span>
              </td>
              <td>
                <button (click)="viewTmlDetails(tml)" class="action-btn view">
                  View
                </button>
                <button (click)="viewTmlHistory(tml)" class="action-btn history">
                  History
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button 
          (click)="previousPage()" 
          [disabled]="currentPage === 1"
          class="pagination-btn">
          Previous
        </button>
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages() }}
        </span>
        <button 
          (click)="nextPage()" 
          [disabled]="currentPage === totalPages()"
          class="pagination-btn">
          Next
        </button>
      </div>

      <!-- TML History Modal -->
      <div class="modal" *ngIf="showHistoryModal()" (click)="closeHistoryModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Measurement History - {{ selectedTml()?.tmlId }}</h2>
            <button (click)="closeHistoryModal()" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="history-chart">
              <canvas #historyChart></canvas>
            </div>
            <table class="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Thickness (mm)</th>
                  <th>Corrosion Rate (mpy)</th>
                  <th>Temperature (°C)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let measurement of tmlHistory()">
                  <td>{{ formatDate(measurement.measurementDate) }}</td>
                  <td>{{ measurement.thickness.toFixed(2) }}</td>
                  <td>{{ measurement.corrosionRate.toFixed(2) }}</td>
                  <td>{{ measurement.temperature.toFixed(1) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tml-management {
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

    .header-actions {
      display: flex;
      gap: 15px;
    }

    .filter-select, .search-input {
      padding: 10px 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
    }

    .filter-select {
      min-width: 200px;
    }

    .search-input {
      width: 250px;
    }

    .filter-select:focus, .search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .tml-table-container {
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .tml-table {
      width: 100%;
      border-collapse: collapse;
    }

    .tml-table th {
      background: #f7fafc;
      padding: 15px;
      text-align: left;
      font-weight: 600;
      color: #4a5568;
      border-bottom: 2px solid #e2e8f0;
      cursor: pointer;
      user-select: none;
    }

    .tml-table th:hover {
      background: #edf2f7;
    }

    .sort-indicator {
      margin-left: 5px;
      color: #667eea;
    }

    .tml-table td {
      padding: 15px;
      border-bottom: 1px solid #e2e8f0;
    }

    .tml-table tr:hover {
      background: #f7fafc;
    }

    .tml-id {
      font-weight: 600;
      color: #667eea;
    }

    .high-risk {
      color: #f56565;
      font-weight: bold;
    }

    .risk-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .risk-badge.low {
      background: #c6f6d5;
      color: #22543d;
    }

    .risk-badge.moderate {
      background: #fed7aa;
      color: #7c2d12;
    }

    .risk-badge.high {
      background: #feb2b2;
      color: #742a2a;
    }

    .action-btn {
      padding: 6px 12px;
      margin: 0 4px;
      border: none;
      border-radius: 4px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .action-btn.view {
      background: #667eea;
      color: white;
    }

    .action-btn.view:hover {
      background: #5a67d8;
    }

    .action-btn.history {
      background: #48bb78;
      color: white;
    }

    .action-btn.history:hover {
      background: #38a169;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      margin-top: 30px;
    }

    .pagination-btn {
      padding: 10px 20px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .pagination-btn:hover:not(:disabled) {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-weight: 500;
      color: #4a5568;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 10px;
      width: 90%;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 2rem;
      cursor: pointer;
      color: #718096;
    }

    .close-btn:hover {
      color: #2d3748;
    }

    .modal-body {
      padding: 20px;
    }

    .history-chart {
      height: 300px;
      margin-bottom: 30px;
    }

    .history-table {
      width: 100%;
      border-collapse: collapse;
    }

    .history-table th {
      background: #f7fafc;
      padding: 10px;
      text-align: left;
      font-weight: 600;
      color: #4a5568;
      border-bottom: 2px solid #e2e8f0;
    }

    .history-table td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
    }
  `]
})
export class TmlManagementComponent implements OnInit {
  tmls = signal<any[]>([]);
  filteredTmls = signal<any[]>([]);
  paginatedTmls = signal<any[]>([]);
  circuits = signal<string[]>([]);
  selectedCircuitFilter = '';
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  showHistoryModal = signal(false);
  selectedTml = signal<any>(null);
  tmlHistory = signal<any[]>([]);

  constructor(private corrosionService: CorrosionDataService) {}

  async ngOnInit() {
    await this.loadTmls();
    await this.loadCircuits();
  }

  async loadTmls() {
    const allTmls = await this.corrosionService.getAllTmls();
    const measurements = await this.corrosionService.getMeasurements();

    const tmlsWithData = allTmls.map(tml => {
      const tmlMeasurements = measurements.filter(m => m.tmlRecordId === tml.id);
      const latestMeasurement = tmlMeasurements.sort((a, b) => 
        new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
      )[0];

      let riskLevel = 'low';
      if (latestMeasurement) {
        if (latestMeasurement.corrosionRate > 50) riskLevel = 'high';
        else if (latestMeasurement.corrosionRate > 25) riskLevel = 'moderate';
      }

      return {
        ...tml,
        latestThickness: latestMeasurement?.thickness,
        latestCorrosionRate: latestMeasurement?.corrosionRate,
        latestTemperature: latestMeasurement?.temperature,
        measurementDate: latestMeasurement?.measurementDate,
        riskLevel
      };
    });

    this.tmls.set(tmlsWithData);
    this.filteredTmls.set(tmlsWithData);
    this.updatePagination();
  }

  async loadCircuits() {
    const circuits = await this.corrosionService.getCircuits();
    this.circuits.set(circuits);
  }

  filterTmls() {
    let filtered = this.tmls();

    if (this.selectedCircuitFilter) {
      filtered = filtered.filter(tml => tml.circuitId === this.selectedCircuitFilter);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(tml => 
        tml.tmlId.toLowerCase().includes(term)
      );
    }

    this.filteredTmls.set(filtered);
    this.currentPage = 1;
    this.updatePagination();
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    const sorted = [...this.filteredTmls()].sort((a, b) => {
      const aVal = a[field] ?? '';
      const bVal = b[field] ?? '';
      
      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredTmls.set(sorted);
    this.updatePagination();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedTmls.set(this.filteredTmls().slice(start, end));
  }

  totalPages(): number {
    return Math.ceil(this.filteredTmls().length / this.itemsPerPage);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  viewTmlDetails(tml: any) {
    alert(`TML Details:\n\nID: ${tml.tmlId}\nCircuit: ${tml.circuitId}\nRisk Level: ${tml.riskLevel}`);
  }

  async viewTmlHistory(tml: any) {
    this.selectedTml.set(tml);
    const history = await this.corrosionService.getMeasurementsByTmlId(tml.id);
    this.tmlHistory.set(history.sort((a, b) => 
      new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime()
    ));
    this.showHistoryModal.set(true);
  }

  closeHistoryModal() {
    this.showHistoryModal.set(false);
    this.selectedTml.set(null);
    this.tmlHistory.set([]);
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