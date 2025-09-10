import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CorrosionDataService } from '../../services/corrosion-data.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics">
      <h1>Analytics & Trends</h1>
      
      <div class="charts-grid">
        <div class="chart-card">
          <h2>Corrosion Rate Trend</h2>
          <div #corrosionChart class="chart-container"></div>
        </div>
        
        <div class="chart-card">
          <h2>Thickness Trend</h2>
          <div #thicknessChart class="chart-container"></div>
        </div>
        
        <div class="chart-card">
          <h2>Risk Distribution</h2>
          <div #riskChart class="chart-container"></div>
        </div>
        
        <div class="chart-card">
          <h2>Circuit Performance</h2>
          <div #circuitChart class="chart-container"></div>
        </div>
      </div>

      <div class="statistics-section">
        <h2>Key Statistics</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <label>Average Corrosion Rate</label>
            <span class="stat-value">{{ avgCorrosionRate() }} mpy</span>
          </div>
          <div class="stat-item">
            <label>Max Corrosion Rate</label>
            <span class="stat-value danger">{{ maxCorrosionRate() }} mpy</span>
          </div>
          <div class="stat-item">
            <label>Min Thickness</label>
            <span class="stat-value warning">{{ minThickness() }} mm</span>
          </div>
          <div class="stat-item">
            <label>Critical TMLs</label>
            <span class="stat-value danger">{{ criticalTmls() }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics {
      max-width: 1400px;
      margin: 0 auto;
    }

    h1 {
      color: #333;
      margin-bottom: 30px;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .chart-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .chart-card h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 1.2rem;
    }

    .chart-container {
      height: 300px;
      position: relative;
    }

    .statistics-section {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .statistics-section h2 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .stat-item {
      text-align: center;
      padding: 20px;
      background: #f7fafc;
      border-radius: 8px;
    }

    .stat-item label {
      display: block;
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 10px;
    }

    .stat-value {
      display: block;
      font-size: 1.8rem;
      font-weight: bold;
      color: #333;
    }

    .stat-value.danger {
      color: #f56565;
    }

    .stat-value.warning {
      color: #ed8936;
    }
  `]
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('corrosionChart') corrosionChart!: ElementRef;
  @ViewChild('thicknessChart') thicknessChart!: ElementRef;
  @ViewChild('riskChart') riskChart!: ElementRef;
  @ViewChild('circuitChart') circuitChart!: ElementRef;

  avgCorrosionRate = signal(0);
  maxCorrosionRate = signal(0);
  minThickness = signal(0);
  criticalTmls = signal(0);

  private measurements: any[] = [];
  private tmls: any[] = [];

  constructor(private corrosionService: CorrosionDataService) {}

  async ngOnInit() {
    await this.loadData();
    await this.calculateStatistics();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.createCharts();
    }, 100);
  }

  async loadData() {
    this.measurements = await this.corrosionService.getMeasurements();
    this.tmls = await this.corrosionService.getAllTmls();
  }

  async calculateStatistics() {
    if (this.measurements.length === 0) return;

    const avgCorr = this.measurements.reduce((sum, m) => sum + (m.corrosionRate || 0), 0) / this.measurements.length;
    const maxCorr = Math.max(...this.measurements.map(m => m.corrosionRate || 0));
    const minThick = Math.min(...this.measurements.map(m => m.thickness || Infinity));
    
    const latestByTml = new Map();
    this.measurements.forEach(m => {
      if (!latestByTml.has(m.tmlRecordId) || 
          new Date(m.measurementDate) > new Date(latestByTml.get(m.tmlRecordId).measurementDate)) {
        latestByTml.set(m.tmlRecordId, m);
      }
    });

    const critical = Array.from(latestByTml.values()).filter(m => m.corrosionRate > 50).length;

    this.avgCorrosionRate.set(Math.round(avgCorr * 100) / 100);
    this.maxCorrosionRate.set(Math.round(maxCorr * 100) / 100);
    this.minThickness.set(Math.round(minThick * 100) / 100);
    this.criticalTmls.set(critical);
  }

  createCharts() {
    this.createCorrosionTrendChart();
    this.createThicknessTrendChart();
    this.createRiskDistributionChart();
    this.createCircuitPerformanceChart();
  }

  createCorrosionTrendChart() {
    const element = this.corrosionChart.nativeElement;
    const margin = {top: 20, right: 30, bottom: 40, left: 50};
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    // Group data by date
    const dataByDate = d3.rollup(
      this.measurements,
      v => d3.mean(v, d => d.corrosionRate),
      d => d.measurementDate
    );

    const data = Array.from(dataByDate, ([date, value]) => ({
      date: new Date(date),
      value: value || 0
    })).sort((a, b) => a.date.getTime() - b.date.getTime());

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) as number])
      .range([height, 0]);

    const line = d3.line<any>()
      .x(d => x(d.date))
      .y(d => y(d.value));

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .call(d3.axisLeft(y));

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#667eea')
      .attr('stroke-width', 2)
      .attr('d', line);

    svg.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.value))
      .attr('r', 4)
      .attr('fill', '#667eea');
  }

  createThicknessTrendChart() {
    const element = this.thicknessChart.nativeElement;
    const margin = {top: 20, right: 30, bottom: 40, left: 50};
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const dataByDate = d3.rollup(
      this.measurements,
      v => d3.mean(v, d => d.thickness),
      d => d.measurementDate
    );

    const data = Array.from(dataByDate, ([date, value]) => ({
      date: new Date(date),
      value: value || 0
    })).sort((a, b) => a.date.getTime() - b.date.getTime());

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) as number])
      .range([height, 0]);

    const line = d3.line<any>()
      .x(d => x(d.date))
      .y(d => y(d.value));

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .call(d3.axisLeft(y));

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#48bb78')
      .attr('stroke-width', 2)
      .attr('d', line);

    svg.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.value))
      .attr('r', 4)
      .attr('fill', '#48bb78');
  }

  createRiskDistributionChart() {
    const element = this.riskChart.nativeElement;
    const margin = {top: 20, right: 30, bottom: 40, left: 50};
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const latestByTml = new Map();
    this.measurements.forEach(m => {
      if (!latestByTml.has(m.tmlRecordId) || 
          new Date(m.measurementDate) > new Date(latestByTml.get(m.tmlRecordId).measurementDate)) {
        latestByTml.set(m.tmlRecordId, m);
      }
    });

    const riskCategories = [
      { label: 'Low', range: '< 10 mpy', count: 0, color: '#48bb78' },
      { label: 'Moderate', range: '10-25 mpy', count: 0, color: '#ed8936' },
      { label: 'High', range: '25-50 mpy', count: 0, color: '#f56565' },
      { label: 'Severe', range: '> 50 mpy', count: 0, color: '#9f1239' }
    ];

    latestByTml.forEach((m) => {
      const rate = m.corrosionRate || 0;
      if (rate < 10) riskCategories[0].count++;
      else if (rate < 25) riskCategories[1].count++;
      else if (rate < 50) riskCategories[2].count++;
      else riskCategories[3].count++;
    });

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .domain(riskCategories.map(d => d.label))
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(riskCategories, d => d.count) as number])
      .range([height, 0]);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .call(d3.axisLeft(y));

    svg.selectAll('.bar')
      .data(riskCategories)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label) as number)
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.count))
      .attr('height', d => height - y(d.count))
      .attr('fill', d => d.color);
  }

  createCircuitPerformanceChart() {
    const element = this.circuitChart.nativeElement;
    const margin = {top: 20, right: 30, bottom: 100, left: 50};
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    // Calculate average corrosion rate by circuit
    const circuitData = d3.rollup(
      this.measurements,
      v => d3.mean(v, d => d.corrosionRate),
      d => {
        const tml = this.tmls.find(t => t.id === d.tmlRecordId);
        return tml?.circuitId || 'Unknown';
      }
    );

    const data = Array.from(circuitData, ([circuit, value]) => ({
      circuit,
      value: value || 0
    })).sort((a, b) => b.value - a.value).slice(0, 10);

    const svg = d3.select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d.circuit))
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) as number])
      .range([height, 0]);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    svg.append('g')
      .call(d3.axisLeft(y));

    svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.circuit) as number)
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.value))
      .attr('height', d => height - y(d.value))
      .attr('fill', d => d.value > 30 ? '#f56565' : '#4299e1');
  }
}