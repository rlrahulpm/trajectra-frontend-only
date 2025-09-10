# TML Corrosion Monitoring System

A comprehensive Angular frontend application for monitoring and managing TML (Thickness Measurement Location) corrosion data in industrial equipment.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm start

# Open browser to http://localhost:4200
```

### Production Build

```bash
# Build for production
npm run build

# Serve the built files (optional)
npx serve dist/tml-corrosion-angular
```

## 📊 Features

### **Dashboard**
- Real-time system overview with key performance metrics
- Risk distribution charts and statistics  
- Recent measurements tracking
- Quick action shortcuts

### **Circuit Management**
- Complete circuit inventory with performance analytics
- Circuit-specific TML point listings
- Risk level assessment and monitoring
- Data export capabilities per circuit

### **TML Point Management**
- Comprehensive TML catalog with advanced filtering
- Sortable tables with search functionality
- Individual TML measurement history
- Risk-based categorization

### **Measurement Management**
- Add new measurements with form validation
- View and edit existing measurement records
- Delete outdated or incorrect entries
- Real-time data validation and feedback

### **Advanced Analytics**
- Interactive D3.js charts for trend analysis
- Corrosion rate and thickness progression over time
- Risk distribution visualizations
- Circuit performance comparisons

### **Classification System**
- Configurable corrosion rate thresholds
- Thickness classification management
- Risk level definitions and color coding

### **Reports & Export**
- Complete system reports generation
- Circuit-specific detailed reports
- Risk assessment summaries
- CSV export functionality for all data

### **Flow Visualization**
- Interactive Sankey diagrams for temporal tracking
- TML flow analysis between time periods
- Drill-down capabilities for detailed inspection

## 🎨 Technical Features

- **Standalone Operation**: No backend required - uses comprehensive mock data
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern Angular**: Built with Angular 20+ and standalone components
- **Data Visualization**: D3.js integration for advanced charting
- **Performance Optimized**: Lazy-loaded routes and optimized bundles
- **Professional UI**: Modern design with smooth animations

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/              # Main dashboard
│   │   ├── circuit-management/     # Circuit management interface
│   │   ├── tml-management/         # TML point management
│   │   ├── measurement-management/ # Measurement CRUD operations
│   │   ├── analytics/              # Charts and trend analysis
│   │   ├── classification-management/ # Risk classifications
│   │   ├── reports/                # Report generation
│   │   ├── layout/                 # Navigation and layout
│   │   ├── sankey-chart/           # Flow diagram component
│   │   └── tml-modal/              # TML detail modal
│   ├── services/
│   │   └── corrosion-data.service.ts # Mock data service
│   └── models/
│       └── corrosion-data.interface.ts # TypeScript interfaces
├── environments/
│   └── environment.ts              # Environment configuration
└── styles.css                     # Global styles
```

## 💾 Mock Data

The application includes comprehensive mock data simulating a real industrial corrosion monitoring system:

- **20 TML Points** across 10 different industrial circuits
- **30 Measurements** spanning 3 months (Jan-Mar 2025)  
- **9 Classification Rules** for corrosion rates and thickness
- **Realistic Values**: Simulated corrosion rates, thickness measurements, and temperatures
- **Trending Data**: Data shows realistic progression over time

## 🔧 Customization

### Adding More Mock Data
Edit `src/app/services/corrosion-data.service.ts` to modify the mock data arrays:
- `mockTmls` - TML point definitions
- `mockMeasurements` - Measurement records
- `mockClassifications` - Risk classification rules

### Connecting to Real API
To connect to a real backend API:
1. Update `src/environments/environment.ts` with your API URL
2. Replace the mock service methods in `corrosion-data.service.ts` with HTTP calls
3. Ensure your API endpoints match the expected data formats

## 🎯 Use Cases

Perfect for:
- **Prototype Demonstrations**: Showcase corrosion monitoring capabilities
- **System Design Reviews**: Validate UI/UX with stakeholders  
- **Training**: Demonstrate system functionality without live data
- **Development**: Frontend development without backend dependencies

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚢 Deployment

The built application in `dist/` is static and can be deployed to any web server:
- AWS S3 + CloudFront
- Netlify
- Vercel
- GitHub Pages
- Traditional web servers (Apache, Nginx)

---

**Built with Angular, D3.js, and modern web technologies for industrial corrosion monitoring.**