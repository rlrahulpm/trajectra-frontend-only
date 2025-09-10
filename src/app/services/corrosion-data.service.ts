import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CorrosionData, TmlData } from '../models/corrosion-data.interface';

@Injectable({
  providedIn: 'root'
})
export class CorrosionDataService {
  private dataSubject = new BehaviorSubject<CorrosionData>({ nodes: [], links: [] });
  public data$ = this.dataSubject.asObservable();

  private mockClassifications = [
    { id: 1, classificationType: 'CORROSION_RATE', rangeLabel: 'Low', minValue: 0, maxValue: 10 },
    { id: 2, classificationType: 'CORROSION_RATE', rangeLabel: 'Moderate', minValue: 10, maxValue: 25 },
    { id: 3, classificationType: 'CORROSION_RATE', rangeLabel: 'High', minValue: 25, maxValue: 50 },
    { id: 4, classificationType: 'CORROSION_RATE', rangeLabel: 'Severe', minValue: 50, maxValue: 100 },
    { id: 5, classificationType: 'CORROSION_RATE', rangeLabel: 'Critical', minValue: 100, maxValue: null },
    { id: 6, classificationType: 'THICKNESS', rangeLabel: 'Critical', minValue: 0, maxValue: 5 },
    { id: 7, classificationType: 'THICKNESS', rangeLabel: 'Warning', minValue: 5, maxValue: 10 },
    { id: 8, classificationType: 'THICKNESS', rangeLabel: 'Acceptable', minValue: 10, maxValue: 15 },
    { id: 9, classificationType: 'THICKNESS', rangeLabel: 'Good', minValue: 15, maxValue: 50 },
  ];

  // Mock data - 100 TMLs across 15 circuits  
  private mockTmls: any[] = [];
  private mockMeasurements: any[] = [];

  constructor() {
    this.mockTmls = this.generateTMLs();
    this.mockMeasurements = this.generateRealisticMeasurements();
  }

  private generateTMLs(): any[] {
    const circuits = [
      'PIPE-100-CS', 'PIPE-101-SS', 'VESSEL-200-CS', 'VESSEL-201-SS316', 
      'TANK-300-CS', 'TANK-301-SS', 'REACTOR-400-SS316', 'REACTOR-401-CS',
      'EXCHANGER-500-CS', 'EXCHANGER-501-SS', 'COLUMN-600-SS', 'COLUMN-601-CS',
      'DRUM-700-CS', 'DRUM-701-SS316', 'SEPARATOR-800-CS'
    ];
    
    // Fixed distribution: 6-7 TMLs per circuit to reach 100 exactly
    const tmlsPerCircuit = [7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6]; // 15 circuits = 100 TMLs
    
    const tmls: any[] = [];
    let tmlCounter = 1;
    
    circuits.forEach((circuitId, circuitIndex) => {
      const tmlCount = tmlsPerCircuit[circuitIndex];
      for (let i = 1; i <= tmlCount; i++) {
        tmls.push({
          id: tmlCounter,
          circuitId: circuitId,
          tmlId: `TML-${tmlCounter.toString().padStart(3, '0')}`
        });
        tmlCounter++;
      }
    });
    
    return tmls;
  }

  private generateRealisticMeasurements(): any[] {
    const measurements: any[] = [];
    let measurementId = 1;
    
    // Deterministic seed values for consistent data
    const seedValues = [
      { thickness: 28.5, corrosionRate: 8.2, temperature: 85.3, increasing: true },
      { thickness: 22.1, corrosionRate: 12.7, temperature: 92.1, increasing: true },
      { thickness: 19.8, corrosionRate: 35.4, temperature: 78.9, increasing: true },
      { thickness: 25.3, corrosionRate: 6.6, temperature: 105.7, increasing: false },
      { thickness: 17.7, corrosionRate: 28.3, temperature: 89.4, increasing: true },
      { thickness: 21.4, corrosionRate: 18.9, temperature: 95.8, increasing: true },
      { thickness: 16.2, corrosionRate: 45.7, temperature: 82.1, increasing: true },
      { thickness: 23.8, corrosionRate: 9.3, temperature: 98.6, increasing: false },
      { thickness: 20.5, corrosionRate: 22.1, temperature: 87.2, increasing: true },
      { thickness: 18.9, corrosionRate: 31.5, temperature: 91.7, increasing: true }
    ];
    
    // Create measurements for all 100 TMLs across 3 months
    for (let tmlId = 1; tmlId <= 100; tmlId++) {
      // Use deterministic pattern based on TML ID
      const seedIndex = (tmlId - 1) % seedValues.length;
      const seed = seedValues[seedIndex];
      
      // 60% have increasing trends (deterministic based on ID)
      const hasIncreasingTrend = seed.increasing && ((tmlId - 1) % 5 < 3);
      
      // Base values for this TML
      const baseThickness = seed.thickness + ((tmlId - 1) % 7) - 3; // vary by ±3
      const baseCorrosionRate = seed.corrosionRate + ((tmlId - 1) % 11) - 5; // vary by ±5
      const baseTemperature = seed.temperature + ((tmlId - 1) % 13) - 6; // vary by ±6
      
      // Generate measurements for 3 months
      const months = [
        { date: '2025-01-01', month: 'Jan' },
        { date: '2025-02-01', month: 'Feb' },
        { date: '2025-03-01', month: 'Mar' }
      ];
      
      months.forEach((monthData, monthIndex) => {
        let thickness = baseThickness;
        let corrosionRate = Math.max(1, baseCorrosionRate); // min 1 mpy
        let temperature = Math.max(60, baseTemperature); // min 60°C
        
        if (hasIncreasingTrend) {
          // Increasing corrosion and temperature trend
          const growthFactor = 1 + (monthIndex * 0.18); // 18% increase per month
          corrosionRate *= growthFactor;
          temperature *= (1 + monthIndex * 0.12); // 12% temperature increase per month
          thickness *= (1 - monthIndex * 0.03); // 3% thickness decrease per month
        } else {
          // Stable trend with minor variations
          const stableVariation = 1 + (((tmlId + monthIndex) % 7) - 3) * 0.02; // ±6% deterministic variation
          corrosionRate *= stableVariation;
          temperature *= (1 + (((tmlId + monthIndex) % 5) - 2) * 0.01); // ±2% variation
          thickness *= (1 + (((tmlId + monthIndex) % 3) - 1) * 0.005); // ±0.5% variation
        }
        
        measurements.push({
          id: measurementId++,
          tmlRecordId: tmlId,
          measurementDate: monthData.date,
          thickness: Math.round(Math.max(5, thickness) * 10) / 10, // min 5mm
          corrosionRate: Math.round(Math.max(1, corrosionRate) * 10) / 10, // min 1 mpy
          temperature: Math.round(Math.max(60, temperature) * 10) / 10 // min 60°C
        });
      });
    }
    
    return measurements;
  }

  private simulateApiDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  async getAllTmls(): Promise<any[]> {
    await this.simulateApiDelay();
    return [...this.mockTmls];
  }

  async getTmlById(id: number): Promise<any> {
    await this.simulateApiDelay();
    return this.mockTmls.find(tml => tml.id === id) || null;
  }

  async getMeasurements(): Promise<any[]> {
    await this.simulateApiDelay();
    return [...this.mockMeasurements];
  }

  async getMeasurementsByTmlId(tmlId: number): Promise<any[]> {
    await this.simulateApiDelay();
    return this.mockMeasurements.filter(m => m.tmlRecordId === tmlId);
  }

  async getClassifications(): Promise<any[]> {
    await this.simulateApiDelay();
    return [...this.mockClassifications];
  }

  async getCircuits(): Promise<string[]> {
    await this.simulateApiDelay();
    const circuits = [...new Set(this.mockTmls.map(tml => tml.circuitId))];
    return circuits.sort();
  }

  async getTmlsByCircuit(circuitId: string): Promise<any[]> {
    await this.simulateApiDelay();
    return this.mockTmls.filter(tml => tml.circuitId === circuitId);
  }

  async getAvailableDates(): Promise<string[]> {
    await this.simulateApiDelay();
    const dates = [...new Set(this.mockMeasurements.map(m => m.measurementDate))];
    return dates.sort();
  }

  async getTemporalTracking(startDate: string, endDate: string, maxCorrosionRate: number): Promise<any[]> {
    await this.simulateApiDelay();
    
    // Use the end date to determine which measurement set to use
    const endDateObj = new Date(endDate);
    const endMonth = endDateObj.getMonth() + 1; // 1-based month
    
    // Get measurements for the end month only to ensure consistent results
    let targetMeasurements: any[] = [];
    
    if (endMonth === 1) { // January
      targetMeasurements = this.mockMeasurements.filter(m => m.measurementDate.startsWith('2025-01'));
    } else if (endMonth === 2) { // February  
      targetMeasurements = this.mockMeasurements.filter(m => m.measurementDate.startsWith('2025-02'));
    } else if (endMonth === 3) { // March
      targetMeasurements = this.mockMeasurements.filter(m => m.measurementDate.startsWith('2025-03'));
    }
    
    // Filter by initial corrosion rate criteria (start month filter would be applied to determine eligible TMLs)
    const filteredMeasurements = targetMeasurements.filter(m => {
      // Find the initial measurement (January) for this TML to check initial rate
      const initialMeasurement = this.mockMeasurements.find(initial => 
        initial.tmlRecordId === m.tmlRecordId && initial.measurementDate.startsWith('2025-01')
      );
      
      return initialMeasurement && initialMeasurement.corrosionRate <= maxCorrosionRate;
    });

    // Create temporal tracking data using consistent categorization
    const temporalData = filteredMeasurements.map(m => {
      const tml = this.mockTmls.find(t => t.id === m.tmlRecordId);
      let endCategory = '> 50 mpy';
      if (m.corrosionRate < 10) endCategory = '< 10 mpy';
      else if (m.corrosionRate < 20) endCategory = '10-20 mpy';
      else if (m.corrosionRate < 30) endCategory = '20-30 mpy';
      else if (m.corrosionRate < 50) endCategory = '30-50 mpy';

      return {
        tmlId: tml?.tmlId,
        circuitId: tml?.circuitId,
        endCategory,
        endCorrosionRate: m.corrosionRate,
        thickness: m.thickness,
        temperature: m.temperature,
        measurementDate: m.measurementDate
      };
    });

    return temporalData;
  }

  async createMeasurement(measurement: any): Promise<any> {
    await this.simulateApiDelay();
    const newId = Math.max(...this.mockMeasurements.map(m => m.id)) + 1;
    const newMeasurement = { ...measurement, id: newId };
    this.mockMeasurements.push(newMeasurement);
    return newMeasurement;
  }

  async updateMeasurement(id: number, measurement: any): Promise<any> {
    await this.simulateApiDelay();
    const index = this.mockMeasurements.findIndex(m => m.id === id);
    if (index !== -1) {
      this.mockMeasurements[index] = { ...measurement, id };
      return this.mockMeasurements[index];
    }
    throw new Error('Measurement not found');
  }

  async deleteMeasurement(id: number): Promise<void> {
    await this.simulateApiDelay();
    const index = this.mockMeasurements.findIndex(m => m.id === id);
    if (index !== -1) {
      this.mockMeasurements.splice(index, 1);
    } else {
      throw new Error('Measurement not found');
    }
  }

  async getStatistics(): Promise<any> {
    await this.simulateApiDelay();
    
    const totalMeasurements = this.mockMeasurements.length;
    const totalTmls = this.mockTmls.length;
    const circuits = await this.getCircuits();
    const totalCircuits = circuits.length;
    
    const avgCorrosionRate = this.mockMeasurements.length > 0 
      ? this.mockMeasurements.reduce((sum, m) => sum + m.corrosionRate, 0) / this.mockMeasurements.length 
      : 0;
    
    const avgThickness = this.mockMeasurements.length > 0
      ? this.mockMeasurements.reduce((sum, m) => sum + m.thickness, 0) / this.mockMeasurements.length
      : 0;
    
    const latestDate = this.mockMeasurements.length > 0
      ? this.mockMeasurements.reduce((latest, m) => {
          const mDate = new Date(m.measurementDate);
          return mDate > latest ? mDate : latest;
        }, new Date(this.mockMeasurements[0].measurementDate))
      : new Date();
    
    return {
      totalMeasurements,
      totalTmls,
      totalCircuits,
      avgCorrosionRate: avgCorrosionRate.toFixed(2),
      avgThickness: avgThickness.toFixed(2),
      latestMeasurementDate: latestDate.toISOString().split('T')[0]
    };
  }

  // Sankey diagram methods
  async filterAndGenerateSankeyData(startDate: string, endDate: string, maxCorrosionRate: number): Promise<void> {
    try {
      const temporalData = await this.getTemporalTracking(startDate, endDate, maxCorrosionRate);
      
      if (temporalData && temporalData.length > 0) {
        this.generateSankeyFromTemporalData(temporalData, startDate, endDate, maxCorrosionRate);
      } else {
        const emptyData = {
          nodes: [
            { name: `TMLs with <= ${maxCorrosionRate} mpy corrosion rate as on ${startDate}` },
            { name: "< 10 mpy" },
            { name: "10-20 mpy" },
            { name: "20-30 mpy" },
            { name: "30-50 mpy" },
            { name: "> 50 mpy" }
          ],
          links: []
        };
        this.dataSubject.next(emptyData);
      }
    } catch (error) {
      console.error('Error generating temporal tracking data:', error);
    }
  }

  private generateSankeyFromTemporalData(temporalData: any[], startDate: string, endDate: string, maxCorrosionRate: number): void {
    const categoryGroups: { [key: string]: any[] } = {};
    
    temporalData.forEach(record => {
      const category = record.endCategory;
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(record);
    });

    const nodes = [
      { name: `TMLs with <= ${maxCorrosionRate} mpy corrosion rate as on ${startDate}` }
    ];

    const links: any[] = [];
    const availableCategories = ["< 10 mpy", "10-20 mpy", "20-30 mpy", "30-50 mpy", "> 50 mpy"];
    
    let targetIndex = 1;
    
    availableCategories.forEach(category => {
      const records = categoryGroups[category];
      if (records && records.length > 0) {
        nodes.push({ name: category });
        
        const tmlData: { [key: string]: string[] } = {};
        records.forEach(record => {
          const circuitId = record.circuitId;
          const tmlId = record.tmlId;
          
          if (!tmlData[circuitId]) {
            tmlData[circuitId] = [];
          }
          tmlData[circuitId].push(tmlId);
        });

        Object.keys(tmlData).forEach(circuit => {
          tmlData[circuit].sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, ''), 10);
            const numB = parseInt(b.replace(/\D/g, ''), 10);
            return numA - numB;
          });
        });

        links.push({
          source: 0,
          target: targetIndex,
          value: records.length,
          tmls: tmlData,
          tmlData: records
        });
        
        targetIndex++;
      }
    });

    const sankeyData = { nodes, links };
    this.dataSubject.next(sankeyData);
  }

  getData(): CorrosionData {
    return this.dataSubject.value;
  }

  generateTmlCsv(): string {
    const currentData = this.dataSubject.value;
    let rows = ["Circuit ID,TML ID,Risk Level"];
    currentData.links.forEach(link => {
      if (!link.tmls) return;
      const riskLevel = currentData.nodes[link.target]?.name || 'Unknown';
      for (const [circuit, ids] of Object.entries(link.tmls)) {
        ids.forEach((tml: string) => {
          rows.push(`${circuit},${tml},${riskLevel}`);
        });
      }
    });
    return rows.join("\n");
  }

  async generateExpandedSankeyData(
    startDate: string, 
    endDate: string, 
    expandToDate: string,
    maxCorrosionRate: number, 
    expandedNodeData: any, 
    expandedTmlData: any[]
  ): Promise<void> {
    await this.simulateApiDelay();
    console.log('Generating expanded Sankey data for:', expandedNodeData.name);
    
    try {
      const measurements = await this.getMeasurements();
      const tmls = await this.getAllTmls();
      
      // Create maps for quick lookup
      const tmlMap = new Map();
      tmls.forEach(tml => tmlMap.set(tml.id, tml));
      
      // Get measurements for the expand date (next month)
      const expandMonth = expandToDate.substring(0, 7); // e.g., '2025-03'
      const expandMonthName = new Date(expandToDate).toLocaleDateString('en-US', { month: 'long' });
      
      // Filter measurements for the expanded TMLs on the expand date
      const expandedMeasurements = measurements.filter(measurement => {
        const measurementMonth = measurement.measurementDate.substring(0, 7);
        if (measurementMonth !== expandMonth) return false;
        
        const tml = tmlMap.get(measurement.tmlRecordId);
        if (!tml) return false;
        
        // Check if this TML is in our expanded data
        if (Array.isArray(expandedTmlData)) {
          // If expandedTmlData is an array of TML records
          return expandedTmlData.some(record => record.tmlId === tml.tmlId);
        } else if (typeof expandedTmlData === 'object') {
          // If expandedTmlData is the tmls object (circuit -> tml ids)
          return Object.values(expandedTmlData).some((tmlIds: any) => 
            tmlIds.includes(tml.tmlId)
          );
        }
        return false;
      });
      
      console.log(`Found ${expandedMeasurements.length} measurements for expanded view`);
      
      // Create the expanded Sankey data
      const expandedData: CorrosionData = {
        nodes: [
          { 
            name: `TMLs from ${expandedNodeData.name} category` 
          }
        ],
        links: []
      };
      
      // Group expanded measurements by their new categories
      const newCategoryGroups: { [key: string]: any[] } = {};
      
      expandedMeasurements.forEach(measurement => {
        const rate = measurement.corrosionRate || 0;
        const category = this.getCorrosionCategory(rate);
        
        if (!newCategoryGroups[category]) {
          newCategoryGroups[category] = [];
        }
        newCategoryGroups[category].push({
          ...measurement,
          tml: tmlMap.get(measurement.tmlRecordId)
        });
      });
      
      // Add nodes and links for each new category
      let targetIndex = 1;
      Object.entries(newCategoryGroups).forEach(([category, records]) => {
        if (records.length > 0) {
          const categoryWithMonth = `${category} (${expandMonthName})`;
          expandedData.nodes.push({ name: categoryWithMonth });
          
          // Create TML data for this category
          const tmlData: { [key: string]: string[] } = {};
          records.forEach(record => {
            const circuitId = record.tml.circuitId;
            const tmlId = record.tml.tmlId;
            
            if (!tmlData[circuitId]) {
              tmlData[circuitId] = [];
            }
            tmlData[circuitId].push(tmlId);
          });
          
          // Sort TML IDs within each circuit
          Object.keys(tmlData).forEach(circuit => {
            tmlData[circuit].sort((a, b) => {
              const numA = parseInt(a.replace(/\D/g, ''), 10);
              const numB = parseInt(b.replace(/\D/g, ''), 10);
              return numA - numB;
            });
          });
          
          expandedData.links.push({
            source: 0,
            target: targetIndex,
            value: records.length,
            tmls: tmlData,
            tmlData: records
          });
          
          targetIndex++;
        }
      });
      
      console.log('Generated expanded data:', expandedData);
      
      // Update the data subject with expanded view
      this.dataSubject.next(expandedData);
      
    } catch (error) {
      console.error('Error generating expanded sankey data:', error);
    }
  }

  private getCorrosionCategory(rate: number): string {
    if (rate < 10) return '< 10 mpy';
    else if (rate < 20) return '10-20 mpy';
    else if (rate < 30) return '20-30 mpy';
    else if (rate < 50) return '30-50 mpy';
    else return '> 50 mpy';
  }
}