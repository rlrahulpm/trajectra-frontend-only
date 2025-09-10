import { Component, OnInit, OnDestroy, OnChanges, ElementRef, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { CorrosionData, SankeyLink, TmlData } from '../../models/corrosion-data.interface';
import { CorrosionDataService } from '../../services/corrosion-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sankey-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-wrapper" [attr.data-transitioning]="isTransitioning" style="position: relative;">
      <div #backButton 
           class="back-button" 
           style="display: none;"
           (click)="onBackClick()">
        ← Back
      </div>
      <svg #sankeyChart 
           width="760" 
           height="390" 
           style="max-width: 100%; display: block; margin: 0 auto;">
      </svg>
    </div>
  `
})
export class SankeyChartComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('sankeyChart', { static: true }) sankeyChart!: ElementRef<SVGElement>;
  @ViewChild('backButton', { static: true }) backButton!: ElementRef<HTMLDivElement>;
  @Input() data: CorrosionData | null = null;
  @Input() availableMonths: string[] = [];
  @Input() selectedEndMonth: string = '';
  @Output() linkClick = new EventEmitter<TmlData>();
  @Output() nodeExpand = new EventEmitter<{nodeData: any, tmlData: any[]}>();
  @Output() backClick = new EventEmitter<void>();

  private width = 760;
  private height = 390;
  private svg: any;
  private sankeyGenerator: any;
  private dataSubscription: Subscription | null = null;
  private expandedNodes = new Set<string>(); // Track which nodes are expanded
  private isExpandedView = false; // Track if we're in expanded/drill-down view
  public isTransitioning = false; // Track transition state for animations

  constructor(private corrosionDataService: CorrosionDataService) {}

  ngOnInit(): void {
    console.log('SankeyChart ngOnInit');
    this.initializeChart();
    
    // Test with hardcoded data first
    const testData: CorrosionData = {
      nodes: [
        { name: "Test Source" },
        { name: "Test Target 1" },
        { name: "Test Target 2" }
      ],
      links: [
        { source: 0, target: 1, value: 10 },
        { source: 0, target: 2, value: 20 }
      ]
    };
    
    console.log('Testing with hardcoded data:', testData);
    this.updateChart(testData);
    
    // Subscribe directly to the service data
    this.dataSubscription = this.corrosionDataService.data$.subscribe(data => {
      console.log('SankeyChart received data from service:', data);
      if (data && data.links && data.links.length > 0) {
        console.log('Updating chart with service data');
        this.updateChart(data);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  ngOnChanges(): void {
    console.log('Sankey chart ngOnChanges called with data:', this.data);
    if (this.data && this.svg) {
      this.updateChart(this.data);
    }
  }

  private initializeChart(): void {
    this.svg = d3.select(this.sankeyChart.nativeElement)
      .append("g");

    this.sankeyGenerator = sankey()
      .nodeWidth(20)
      .nodePadding(30)
      .extent([[1, 1], [this.width - 1, this.height - 6]]);
  }

  private updateChart(data: CorrosionData): void {
    console.log('updateChart called with:', data);
    if (!this.svg || !data) {
      console.log('No svg or data:', { svg: !!this.svg, data: !!data });
      return;
    }

    if (!data.nodes || !data.links || data.links.length === 0) {
      console.log('No nodes or links in data');
      return;
    }

    // Check if this is an expanded view (focused drill-down)
    this.isExpandedView = data.nodes.length > 0 && 
      data.nodes[0].name.includes('TMLs from') && 
      data.nodes[0].name.includes('category');

    // Clear previous chart
    this.svg.selectAll("*").remove();

    // Show/hide back button based on expanded view
    if (this.isExpandedView) {
      this.backButton.nativeElement.style.display = 'block';
    } else {
      this.backButton.nativeElement.style.display = 'none';
    }

    // Create a copy of the data for d3 processing
    const graph = this.sankeyGenerator({
      nodes: data.nodes.map(d => ({ ...d })),
      links: data.links.map(d => ({ ...d }))
    });
    
    // Store current links for expansion logic
    this.currentGraphLinks = graph.links;
    
    console.log('Generated graph:', graph);

    // Create gradients for links
    const defs = this.svg.append("defs");
    
    // Create a gradient for each link
    const gradients = defs.selectAll("linearGradient")
      .data(graph.links)
      .join("linearGradient")
      .attr("id", (d: any, i: number) => `gradient-${i}`)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", (d: any) => d.source.x1)
      .attr("y1", (d: any) => (d.source.y0 + d.source.y1) / 2)
      .attr("x2", (d: any) => d.target.x0)
      .attr("y2", (d: any) => (d.target.y0 + d.target.y1) / 2);

    // Add gradient stops
    gradients.selectAll("stop")
      .data((d: any) => [
        { offset: "0%", color: this.getNodeColor(d.source.name) },
        { offset: "100%", color: this.getLinkColor(d.target.name) }
      ])
      .join("stop")
      .attr("offset", (d: any) => d.offset)
      .attr("stop-color", (d: any) => d.color);

    // Create links
    const component = this; // Store reference to component
    this.svg.append("g")
      .selectAll("path")
      .data(graph.links)
      .join("path")
      .attr("class", "link")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke-width", (d: any) => Math.max(15, d.width))
      .attr("stroke", (d: any, i: number) => `url(#gradient-${i})`)
      .style("cursor", "pointer")
      .attr("stroke-opacity", "0.15")
      .style("pointer-events", "all")
      .on("mouseover", function(this: SVGPathElement, event: MouseEvent, d: any) {
        console.log("Link hovered!", d.target.name);
        const selection = d3.select(this);
        // On hover, increase opacity to a more subtle level
        selection.style("stroke-opacity", "0.35");
      })
      .on("mouseout", function(this: SVGPathElement, event: MouseEvent, d: any) {
        console.log("Link mouseout!");
        const selection = d3.select(this);
        // Restore original opacity
        selection.style("stroke-opacity", "0.15");
      })
      .on("click", (event: any, d: SankeyLink) => {
        if (d.tmls) {
          this.linkClick.emit(d.tmls);
        }
      });

    // Create nodes
    const node = this.svg.append("g")
      .selectAll("g")
      .data(graph.nodes)
      .join("g")
      .attr("class", "node");

    // Add rectangles for nodes
    node.append("rect")
      .attr("x", (d: any) => d.x0)
      .attr("y", (d: any) => {
        const originalHeight = d.y1 - d.y0;
        const minHeight = 20; // Minimum height of 20px
        if (originalHeight < minHeight) {
          // Center the node vertically if we're making it taller
          const center = (d.y0 + d.y1) / 2;
          return center - minHeight / 2;
        }
        return d.y0;
      })
      .attr("height", (d: any) => Math.max(20, d.y1 - d.y0))
      .attr("width", (d: any) => d.x1 - d.x0)
      .attr("fill", (d: any) => this.getNodeColor(d.name))
      .attr("fill-opacity", "0.9");

    // Add text labels for nodes
    node.append("text")
      .attr("x", (d: any) => d.x0 < this.width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", (d: any) => {
        const originalHeight = d.y1 - d.y0;
        const minHeight = 20;
        if (originalHeight < minHeight) {
          // Use the centered position if we adjusted the node
          const center = (d.y0 + d.y1) / 2;
          return center;
        }
        return (d.y1 + d.y0) / 2;
      })
      .attr("dy", "0.35em")
      .attr("text-anchor", (d: any) => d.x0 < this.width / 2 ? "start" : "end")
      .text((d: any) => d.index === 0 ? d.name : d.name + (d.value ? ` (${d.value})` : ""));

    // Add + icons within expandable nodes (target bars only, not source)
    console.log('Creating + icons for nodes...');
    const expandableNodes = node.filter((d: any) => {
      const isExpandable = d.index !== 0 && this.isExpandableNode(d);
      console.log(`Node ${d.index} (${d.name}): expandable = ${isExpandable}`);
      return isExpandable;
    });
    
    console.log('Found', expandableNodes.size(), 'expandable nodes');
    
    const plusIcons = expandableNodes
      .append("g")
      .attr("class", "expand-plus")
      .attr("transform", (d: any) => {
        const x = (d.x0 + d.x1) / 2; // Center horizontally within the bar
        const originalHeight = d.y1 - d.y0;
        const minHeight = 20;
        let y;
        if (originalHeight < minHeight) {
          // Use the centered position if we adjusted the node
          y = (d.y0 + d.y1) / 2;
        } else {
          y = (d.y0 + d.y1) / 2;
        }
        console.log(`+ icon position for ${d.name}: translate(${x}, ${y})`);
        console.log(`Node bounds: x0=${d.x0}, x1=${d.x1}, y0=${d.y0}, y1=${d.y1}`);
        return `translate(${x}, ${y})`;
      })
      .style("cursor", "pointer")
      .on("click", (event: any, d: any) => {
        console.log('+ icon clicked for:', d.name);
        event.stopPropagation();
        this.handleNodeExpand(d);
      });
    
    // Add visual elements to + icons
    plusIcons.each((d: any, i: number, nodes: any[]) => {
      const g = d3.select(nodes[i]);
      console.log('Adding visual elements to + icon for:', d.name);
      
      // Add invisible clickable area
      g.append("circle")
        .attr("r", 8)
        .attr("fill", "transparent")
        .style("cursor", "pointer");
      
      // Add + symbol (horizontal line)
      g.append("line")
        .attr("x1", -3)
        .attr("y1", 0)
        .attr("x2", 3)
        .attr("y2", 0)
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .attr("stroke-linecap", "round")
        .style("pointer-events", "none");
      
      // Add + symbol (vertical line)
      g.append("line")
        .attr("x1", 0)
        .attr("y1", -3)
        .attr("x2", 0)
        .attr("y2", 3)
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .attr("stroke-linecap", "round")
        .style("pointer-events", "none");
    });
    
    console.log('+ icons created:', plusIcons.size());
  }

  private getLinkColor(targetName: string): string {
    if (targetName.includes("< 10")) return "#52c41a";
    if (targetName.includes("10-20")) return "#faad14";
    if (targetName.includes("20-30")) return "#fa8c16";
    if (targetName.includes("30-50")) return "#f5222d";
    if (targetName.includes("> 50")) return "#cf1322";
    return "#b0b0b0";
  }

  private getNodeColor(nodeName: string): string {
    if (nodeName.includes("< 10")) return "#52c41a";
    if (nodeName.includes("10-20")) return "#faad14";
    if (nodeName.includes("20-30")) return "#fa8c16";
    if (nodeName.includes("30-50")) return "#f5222d";
    if (nodeName.includes("> 50")) return "#cf1322";
    return "#4a90e2";
  }

  private isExpandableNode(nodeData: any): boolean {
    // Only target bars (not source) with TML data can be expanded
    const hasData = nodeData.index !== 0 && nodeData.value > 0;
    
    // Check if we can expand further (if there's a next month available)
    const canExpand = this.canExpandToNextMonth();
    
    // Restore original logic
    const isExpandable = hasData && canExpand;
    console.log(`isExpandableNode for ${nodeData.name}: index=${nodeData.index}, value=${nodeData.value}, canExpand=${canExpand}, expandable=${isExpandable}`);
    return isExpandable;
  }

  private canExpandToNextMonth(): boolean {
    if (!this.availableMonths || this.availableMonths.length === 0) {
      return false;
    }

    const monthOrder = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Find the last available month
    const lastAvailableMonth = this.availableMonths[this.availableMonths.length - 1];

    if (this.isExpandedView) {
      // In expanded view, check target nodes for current month
      const data = this.corrosionDataService.getData();
      if (!data || !data.nodes) return false;

      const targetNodes = data.nodes.filter(node => node.name.includes('(') && node.name !== data.nodes[0].name);
      if (targetNodes.length > 0) {
        const monthMatch = targetNodes[0].name.match(/\((.+)\)$/);
        if (monthMatch) {
          const currentMonth = monthMatch[1];
          return currentMonth !== lastAvailableMonth;
        }
      }
      return false;
    } else {
      // In main view, check if selected end month is the last available
      return this.selectedEndMonth !== lastAvailableMonth;
    }
  }

  private handleNodeExpand(nodeData: any): void {
    console.log('=== NODE EXPAND DEBUG ===');
    console.log('Node expand clicked:', nodeData);
    
    // Start transition animation immediately
    this.isTransitioning = true;
    
    // Shorter delay for smoother transition like back button
    setTimeout(() => {
      console.log('Available graph links:', this.getCurrentGraphLinks().length);
      
      // Find the link that connects to this node to get TML data
      const connectedLink = this.getCurrentGraphLinks().find((link: any) => {
        const isMatch = link.target === nodeData || link.target.index === nodeData.index;
        console.log(`Checking link: source=${link.source?.index || link.source}, target=${link.target?.index || link.target}, match=${isMatch}`);
        return isMatch;
      });
      
      console.log('Connected link found:', !!connectedLink);
      if (connectedLink) {
        console.log('Link data:', connectedLink);
        console.log('Has tmlData:', !!connectedLink.tmlData);
        console.log('Has tmls:', !!connectedLink.tmls);
        
        if (connectedLink.tmlData) {
          console.log('Expanding node with TML data:', connectedLink.tmlData.length, 'records');
          
          // Emit event to parent component with node data and TML data
          this.nodeExpand.emit({
            nodeData: nodeData,
            tmlData: connectedLink.tmlData
          });
        } else {
          console.log('No tmlData found in connected link');
        }
      } else {
        console.log('No connected link found for node');
      }
      
      // Match back button timing for consistency
      setTimeout(() => {
        this.isTransitioning = false;
      }, 400);
    }, 100);
  }

  private getCurrentGraphLinks(): any[] {
    // Store current graph links for expansion logic
    return this.currentGraphLinks || [];
  }

  public onBackClick(): void {
    console.log('Back button clicked');
    this.backClick.emit();
  }


  private currentGraphLinks: any[] = []; // Store current links
}