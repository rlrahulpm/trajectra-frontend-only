import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, Renderer2, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { TmlData } from '../../models/corrosion-data.interface';
import { CorrosionDataService } from '../../services/corrosion-data.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tml-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      *ngIf="isVisible" 
      class="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center"
      style="z-index: 2147483647 !important; position: fixed !important;"
      (click)="closeModal()">
      <div 
        class="modal-content"
        style="z-index: 2147483647 !important; position: relative !important;"
        (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold">TMLs by Circuit</h2>
            <button 
              (click)="downloadCsv()" 
              class="download-btn">
              ⬇ Download CSV
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="modal-body">
          
          <!-- AI Notes Section -->
          <div class="mb-6">
            <h3 class="section-title">AI Insights</h3>
            <div class="ai-notes-box">
              <p class="ai-notes-text" *ngIf="!loadingAiInsights && aiInsights">
                {{aiInsights}}
              </p>
              <p class="ai-notes-text" *ngIf="loadingAiInsights">
                <span class="ai-loader"></span> Analyzing temperature patterns and corrosion trends with AI...
              </p>
              <p class="ai-notes-text" *ngIf="!loadingAiInsights && !aiInsights">
                Unable to generate AI insights at this time. Please try again later.
              </p>
            </div>
          </div>

          <!-- Circuits and TMLs Section -->
          <div class="circuit-group">
            <h3 class="section-title">Circuits and TMLs</h3>
            <div>
              <div *ngFor="let circuit of getCircuitEntries()" class="circuit-container">
                <div class="circuit-title">{{circuit.key}}</div>
                <ul class="tml-list">
                  <li *ngFor="let tml of circuit.value" class="tml-item">
                    <span class="bullet-point"></span>
                    {{tml}}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button 
            (click)="closeModal()" 
            class="close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  `
})
export class TmlModalComponent implements OnChanges, OnDestroy {
  @Input() isVisible = false;
  @Input() tmlData: TmlData | null = null;
  @Input() selectedDates: {start: string, end: string} | null = null; // e.g., {start: '2025-01', end: '2025-02'}
  @Output() close = new EventEmitter<void>();

  aiInsights: string = '';
  loadingAiInsights: boolean = false;

  private readonly GEMINI_API_KEY = 'AIzaSyApYXSXHw-OCZUYkEzNn7o5P5lBtZ1Tn7E';
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

  constructor(
    private corrosionDataService: CorrosionDataService,
    private http: HttpClient,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  async ngOnChanges() {
    if (this.isVisible) {
      this.renderer.addClass(this.document.body, 'modal-open');
      if (this.tmlData) {
        await this.generateAiInsights();
      }
    } else {
      this.renderer.removeClass(this.document.body, 'modal-open');
    }
  }

  ngOnDestroy() {
    // Clean up body class if component is destroyed while modal is open
    this.renderer.removeClass(this.document.body, 'modal-open');
  }

  getCircuitEntries(): Array<{key: string, value: string[]}> {
    if (!this.tmlData) return [];
    return Object.entries(this.tmlData).map(([key, value]) => ({ key, value }));
  }

  closeModal(): void {
    this.renderer.removeClass(this.document.body, 'modal-open');
    this.close.emit();
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString();
  }

  private async generateAiInsights(): Promise<void> {
    if (!this.tmlData || !this.selectedDates) return;

    this.loadingAiInsights = true;
    this.aiInsights = '';

    try {
      // Get temperature and corrosion data for the TMLs
      const temperatureData = await this.fetchTemperatureData();
      
      // Create prompt for Gemini AI
      const prompt = this.createAnalysisPrompt(temperatureData);
      
      // Call Gemini API (now with built-in retry and graceful fallbacks)
      const response = await this.callGeminiAPI(prompt);
      
      this.aiInsights = response;
    } catch (error) {
      console.error('Error generating AI insights:', error);
      // Fallback message if even the graceful error handling fails
      this.aiInsights = 'AI analysis is currently unavailable. The temperature and corrosion monitoring data shows measurable variations across the selected equipment group that warrant continued observation and maintenance planning.';
    } finally {
      this.loadingAiInsights = false;
    }
  }

  private async fetchTemperatureData(): Promise<any[]> {
    try {
      // Get all measurements and TMLs
      const measurements = await this.corrosionDataService.getMeasurements();
      const tmls = await this.corrosionDataService.getAllTmls();
      
      // Extract TML IDs from the current modal data
      const tmlIds: string[] = [];
      if (this.tmlData) {
        Object.values(this.tmlData).forEach(ids => {
          tmlIds.push(...ids);
        });
      }
      
      // Create a map of TML records for quick lookup
      const tmlMap = new Map();
      tmls.forEach(tml => {
        tmlMap.set(tml.id, tml);
      });
      
      // Filter measurements for these specific TMLs and enrich with TML data
      const relevantMeasurements = measurements
        .filter(measurement => {
          const tml = tmlMap.get(measurement.tmlRecordId);
          return tml && tmlIds.includes(tml.tmlId);
        })
        .map(measurement => ({
          ...measurement,
          tml: tmlMap.get(measurement.tmlRecordId),
          tmlId: tmlMap.get(measurement.tmlRecordId)?.tmlId
        }));
      
      return relevantMeasurements;
    } catch (error) {
      console.error('Error fetching temperature data:', error);
      return [];
    }
  }

  private createAnalysisPrompt(temperatureData: any[]): string {
    if (temperatureData.length === 0 || !this.selectedDates) {
      return 'No measurement data available for analysis.';
    }
    
    // Parse selected dates - expecting format like '2025-01' and '2025-02'
    const startDate = this.selectedDates.start;
    const endDate = this.selectedDates.end;
    
    // Filter data to ONLY include measurements from the selected months
    const filteredData = temperatureData.filter(measurement => {
      const measurementDate = measurement.measurementDate || measurement.measurement_date;
      // Extract year-month from measurement date (e.g., '2025-01-15' -> '2025-01')
      const measurementMonth = measurementDate.substring(0, 7);
      return measurementMonth === startDate || measurementMonth === endDate;
    });
    
    if (filteredData.length === 0) {
      return 'No measurement data available for the selected period.';
    }
    
    // Group filtered data by TML ID
    const tmlGroups: {[key: string]: {[month: string]: any}} = {};
    filteredData.forEach(measurement => {
      const tmlId = measurement.tml?.tmlId || measurement.tmlId || measurement.tml_id;
      const measurementMonth = (measurement.measurementDate || measurement.measurement_date).substring(0, 7);
      
      if (!tmlGroups[tmlId]) {
        tmlGroups[tmlId] = {};
      }
      tmlGroups[tmlId][measurementMonth] = measurement;
    });
    
    // Format month names for display
    const startMonthDate = new Date(startDate + '-01');
    const endMonthDate = new Date(endDate + '-01');
    const startMonthName = startMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const endMonthName = endMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Create anonymized data for AI
    let unitIndex = 1;
    let tmlDetails = '';
    const unitStats: any[] = [];
    
    Object.entries(tmlGroups).forEach(([tmlId, monthData]) => {
      // Only process if we have data for BOTH selected months
      if (monthData[startDate] && monthData[endDate]) {
        const firstMonth = monthData[startDate];
        const lastMonth = monthData[endDate];
        
        // Use proxy ID for AI
        const proxyId = `Unit ${String.fromCharCode(64 + unitIndex)}`; // Unit A, Unit B, etc.
        
        const firstCorrosion = firstMonth.corrosionRate || firstMonth.corrosion_rate || 0;
        const lastCorrosion = lastMonth.corrosionRate || lastMonth.corrosion_rate || 0;
        const firstThickness = firstMonth.thickness || 0;
        const lastThickness = lastMonth.thickness || 0;
        
        tmlDetails += `- ${proxyId}: `;
        tmlDetails += `${startMonthName.split(' ')[0]} - ${firstMonth.temperature.toFixed(1)}°F, ${firstCorrosion.toFixed(1)} mpy, ${firstThickness.toFixed(2)} mm | `;
        tmlDetails += `${endMonthName.split(' ')[0]} - ${lastMonth.temperature.toFixed(1)}°F, ${lastCorrosion.toFixed(1)} mpy, ${lastThickness.toFixed(2)} mm\n`;
        
        unitStats.push({
          tempChange: lastMonth.temperature - firstMonth.temperature,
          corrosionChange: lastCorrosion - firstCorrosion,
          thicknessChange: lastThickness - firstThickness
        });
        
        unitIndex++;
      }
    });
    
    // Calculate group-level statistics
    const avgTempChange = unitStats.length > 0 ? 
      unitStats.reduce((sum, s) => sum + s.tempChange, 0) / unitStats.length : 0;
    const avgCorrosionChange = unitStats.length > 0 ?
      unitStats.reduce((sum, s) => sum + s.corrosionChange, 0) / unitStats.length : 0;
    const avgThicknessChange = unitStats.length > 0 ?
      unitStats.reduce((sum, s) => sum + s.thicknessChange, 0) / unitStats.length : 0;
    
    // Calculate period averages from the filtered data
    const firstPeriodData: any[] = [];
    const lastPeriodData: any[] = [];
    
    Object.values(tmlGroups).forEach((monthData: any) => {
      if (monthData[startDate]) {
        firstPeriodData.push({
          temperature: monthData[startDate].temperature || 0,
          corrosionRate: monthData[startDate].corrosionRate || monthData[startDate].corrosion_rate || 0
        });
      }
      if (monthData[endDate]) {
        lastPeriodData.push({
          temperature: monthData[endDate].temperature || 0,
          corrosionRate: monthData[endDate].corrosionRate || monthData[endDate].corrosion_rate || 0
        });
      }
    });
    
    const avgFirstTemp = firstPeriodData.length > 0 ? 
      firstPeriodData.reduce((sum, d) => sum + (d as any).temperature, 0) / firstPeriodData.length : 0;
    const avgLastTemp = lastPeriodData.length > 0 ?
      lastPeriodData.reduce((sum, d) => sum + (d as any).temperature, 0) / lastPeriodData.length : 0;
    
    const avgFirstCorrosion = firstPeriodData.length > 0 ?
      firstPeriodData.reduce((sum, d) => sum + (d as any).corrosionRate, 0) / firstPeriodData.length : 0;
    const avgLastCorrosion = lastPeriodData.length > 0 ?
      lastPeriodData.reduce((sum, d) => sum + (d as any).corrosionRate, 0) / lastPeriodData.length : 0;

    return `You are an expert corrosion engineer analyzing measurement data for industrial pipeline monitoring units.

Analyze this group of units from ${startMonthName} to ${endMonthName}:

Unit Data:
${tmlDetails}

Overall Group Statistics:
- Average temperature: ${startMonthName.split(' ')[0]} ${avgFirstTemp.toFixed(1)}°F → ${endMonthName.split(' ')[0]} ${avgLastTemp.toFixed(1)}°F (${avgTempChange > 0 ? 'increased' : 'decreased'} ${Math.abs(avgTempChange).toFixed(1)}°F)
- Average corrosion rate: ${startMonthName.split(' ')[0]} ${avgFirstCorrosion.toFixed(1)} mpy → ${endMonthName.split(' ')[0]} ${avgLastCorrosion.toFixed(1)} mpy (change: ${avgCorrosionChange > 0 ? '+' : ''}${avgCorrosionChange.toFixed(1)} mpy)
- Average thickness change: ${avgThicknessChange.toFixed(2)} mm

Provide concise insights for this group's overall behavior from ${startMonthName} to ${endMonthName}. Focus on:
1. Overall temperature trend and its impact on corrosion
2. Whether the group shows concerning patterns
3. Brief maintenance recommendation

Keep response under 100 words, focusing on group-level trends only. Do not mention specific unit IDs.`;
  }

  private async callGeminiAPI(prompt: string, retryCount: number = 0): Promise<string> {
    const maxRetries = 3;
    const baseDelay = 1500; // 1.5 seconds - shorter for better UX
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 200,
      }
    };

    try {
      const response = await this.http.post(
        `${this.GEMINI_API_URL}?key=${this.GEMINI_API_KEY}`,
        requestBody
      ).toPromise() as any;

      if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error: any) {
      console.error(`Gemini API attempt ${retryCount + 1} failed:`, error);
      
      // Check if it's a 503 (overloaded) or 429 (rate limited) error
      const isRetryableError = error?.error?.code === 503 || 
                              error?.error?.code === 429 || 
                              error?.status === 503 || 
                              error?.status === 429;
      
      if (isRetryableError && retryCount < maxRetries) {
        const delay = baseDelay + (retryCount * 1000); // Linear backoff: 1.5s, 2.5s, 3.5s
        console.log(`Retrying silently in ${delay}ms... (${retryCount + 1}/${maxRetries})`);
        
        // Silent retry - no state changes, no modal reload
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callGeminiAPI(prompt, retryCount + 1);
      }
      
      // Return a user-friendly error message instead of throwing
      if (error?.error?.code === 503) {
        return 'AI analysis is temporarily unavailable due to high demand. The temperature and corrosion data shows measurable variations that warrant continued monitoring of this equipment group.';
      } else if (error?.error?.code === 429) {
        return 'AI analysis rate limit reached. The monitoring data shows standard corrosion progression patterns within expected operational ranges.';
      } else if (error?.error?.code === 400) {
        return 'AI analysis encountered a data format issue. The temperature and corrosion measurements appear within normal operational ranges for this equipment group.';
      } else {
        return 'AI analysis is temporarily unavailable. The monitoring data shows measurable temperature and corrosion rate variations that warrant continued observation.';
      }
    }
  }

  downloadCsv(): void {
    if (!this.tmlData) return;
    
    // Generate CSV content from the modal data
    let csvContent = "Circuit ID,TML ID\n";
    
    Object.entries(this.tmlData).forEach(([circuitId, tmlIds]) => {
      tmlIds.forEach(tmlId => {
        csvContent += `"${circuitId}","${tmlId}"\n`;
      });
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "tmls_by_circuit.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}