import { Component, signal, OnInit, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SankeyChartComponent } from './components/sankey-chart/sankey-chart.component';
import { TmlModalComponent } from './components/tml-modal/tml-modal.component';
import { CorrosionDataService } from './services/corrosion-data.service';
import { CorrosionData, TmlData } from './models/corrosion-data.interface';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SankeyChartComponent, TmlModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly initialRate = signal('20');
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly currentData = signal<CorrosionData | null>(null);
  protected readonly isModalVisible = signal(false);
  protected readonly selectedTmlData = signal<TmlData | null>(null);
  protected readonly selectedModalDates = signal<{start: string, end: string} | null>(null);
  protected readonly availableDates = signal<string[]>([]);
  protected readonly availableMonths = signal<string[]>([]);
  protected readonly selectedStartMonth = signal('');
  protected readonly selectedEndMonth = signal('');
  private dateToMonthMap = new Map<string, string[]>();
  private expandedMonthContext: {start: string, end: string} | null = null;

  protected readonly availableEndMonths = computed(() => {
    const startMonth = this.selectedStartMonth();
    const allMonths = this.availableMonths();
    
    if (!startMonth || allMonths.length === 0) {
      return allMonths;
    }
    
    const monthOrder = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const startMonthIndex = monthOrder.indexOf(startMonth);
    
    return allMonths.filter(month => {
      const monthIndex = monthOrder.indexOf(month);
      return monthIndex > startMonthIndex;
    });
  });

  constructor(private corrosionDataService: CorrosionDataService) {}

  async ngOnInit(): Promise<void> {
    this.corrosionDataService.data$.subscribe(data => {
      this.currentData.set(data);
    });
    
    try {
      const dates = await this.corrosionDataService.getAvailableDates();
      this.availableDates.set(dates);
      
      this.processDatesByMonth(dates);
      
      if (dates.length > 0) {
        this.startDate.set(dates[0]);
        this.endDate.set(dates[dates.length - 1]);
        
        const startMonth = this.getMonthName(dates[0]);
        this.selectedStartMonth.set(startMonth);
        
        const monthOrder = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const startMonthIndex = monthOrder.indexOf(startMonth);
        
        let validEndMonth = '';
        for (const month of this.availableMonths()) {
          const monthIndex = monthOrder.indexOf(month);
          if (monthIndex > startMonthIndex) {
            validEndMonth = month;
            break;
          }
        }
        
        if (validEndMonth) {
          this.selectedEndMonth.set(validEndMonth);
          const endDates = this.dateToMonthMap.get(validEndMonth);
          if (endDates && endDates.length > 0) {
            this.endDate.set(endDates[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading available dates:', error);
      this.startDate.set('2025-01-01');
      this.endDate.set('2025-03-31');
      this.selectedStartMonth.set('January');
      this.selectedEndMonth.set('March');
    }
    
    this.updateChart();
  }

  onInputChange(field: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const value = target.value;
    
    switch (field) {
      case 'initialRate':
        this.initialRate.set(value);
        break;
      case 'startMonth':
        this.selectedStartMonth.set(value);
        const startDates = this.dateToMonthMap.get(value);
        if (startDates && startDates.length > 0) {
          this.startDate.set(startDates[0]);
        }
        break;
      case 'endMonth':
        this.selectedEndMonth.set(value);
        const endDates = this.dateToMonthMap.get(value);
        if (endDates && endDates.length > 0) {
          this.endDate.set(endDates[0]);
        }
        break;
    }
    
    this.updateChart();
  }

  private updateChart(): void {
    const rate = parseFloat(this.initialRate());
    const start = this.startDate();
    const end = this.endDate();
    
    if (!isNaN(rate) && start && end) {
      this.corrosionDataService.filterAndGenerateSankeyData(start, end, rate);
    }
  }

  onLinkClick(tmlData: TmlData): void {
    this.selectedTmlData.set(tmlData);
    
    let startMonth: string;
    let endMonth: string;
    
    if (this.expandedMonthContext) {
      startMonth = this.expandedMonthContext.start;
      endMonth = this.expandedMonthContext.end;
    } else {
      startMonth = this.selectedStartMonth();
      endMonth = this.selectedEndMonth();
    }
    
    if (startMonth && endMonth) {
      const startDates = this.dateToMonthMap.get(startMonth) || [];
      const endDates = this.dateToMonthMap.get(endMonth) || [];
      
      if (startDates.length > 0 && endDates.length > 0) {
        const startYearMonth = startDates[0].substring(0, 7);
        const endYearMonth = endDates[0].substring(0, 7);
        
        this.selectedModalDates.set({
          start: startYearMonth,
          end: endYearMonth
        });
      }
    }
    
    this.isModalVisible.set(true);
  }

  onNodeExpand(expandData: {nodeData: any, tmlData: any[]}): void {
    console.log('Node expansion requested:', expandData);
  }

  onBackClick(): void {
    this.expandedMonthContext = null;
    this.updateChart();
  }

  closeModal(): void {
    this.isModalVisible.set(false);
    this.selectedTmlData.set(null);
    this.selectedModalDates.set(null);
  }

  getTotalTmlCount(): number {
    const data = this.currentData();
    if (!data || !data.links) return 0;
    
    return data.links.reduce((total, link) => {
      if (link.source === 0) {
        return total + (link.value || 0);
      }
      return total;
    }, 0);
  }

  getChartDescription(): string {
    const data = this.currentData();
    if (!data || !data.nodes || data.nodes.length === 0) {
      return 'Loading chart data...';
    }

    const totalCount = this.getTotalTmlCount();
    const rate = this.initialRate();
    const startMonth = this.selectedStartMonth();
    const endMonth = this.selectedEndMonth();

    return `${totalCount} TMLs with corrosion rates ≤ ${rate} mpy in ${startMonth}, categorized by corrosion rate in ${endMonth}. Select any flow to view detailed TML and circuit information.`;
  }

  private processDatesByMonth(dates: string[]): void {
    this.dateToMonthMap.clear();
    
    dates.forEach(date => {
      const monthName = this.getMonthName(date);
      if (!this.dateToMonthMap.has(monthName)) {
        this.dateToMonthMap.set(monthName, []);
      }
      this.dateToMonthMap.get(monthName)!.push(date);
    });
    
    const monthOrder = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const uniqueMonths = Array.from(this.dateToMonthMap.keys())
      .sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    
    this.availableMonths.set(uniqueMonths);
  }

  private getMonthName(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'long' });
  }
}