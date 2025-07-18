# 📚 Library Management System - Frontend Interface

A modern web application for library management built with React, Vite, and Tailwind CSS. This frontend application provides an elegant and responsive user interface for managing a collection of books, authors, and shelves, working in conjunction with the [Library Web Service API](https://github.com/Nespouique/library-ws).

## 🏗️ Architecture Overview

This project is the **frontend interface** of a complete library management system:

- **🎨 Frontend** (`library-ihm`) : React + Vite + Tailwind CSS
- **🔧 Backend** (`library-ws`) : Node.js + Express + MySQL + Swagger

### Integration with Backend API

The frontend communicates with the REST API to:

- **Fetch data** : Books, authors, and shelves from MySQL database
- **Manage collections** : CRUD operations through API endpoints
- **Real-time updates** : Seamless synchronization with backend
- **Data validation** : Consistent validation rules across both layers

## 🌟 Features

### 📖 Book Management

- **Collection Display** : Responsive grid view of books
- **Advanced Search** : Search by title, author, or ISBN
- **Complete Details** : Detailed information for each book (title, author, ISBN, description, shelf, publication date)
- **Add New Books** : Intuitive interface to add books to the collection
- **Alphabetical Navigation** : Quick scrolling in alphabetical order

### 👥 Author Management

- **Author Directory** : Complete list of authors with their information
- **Detailed Profiles** : Biographies and lists of works by author
- **Add Authors** : Form to register new authors
- **Automatic Association** : Automatic linking between books and authors

### 📚 Shelf Management

- **Spatial Organization** : Management of physical book locations
- **Overview** : Preview of each shelf's contents
- **Create Shelves** : Interface to add new sections
- **Statistics** : Information about shelf occupancy

### 🗺️ Spatial Visualization System

The application features an advanced **interactive SVG-based spatial visualization** that allows you to:

- **Visual Mapping** : See the physical layout of your library space
- **Interactive Navigation** : Click on locations to view assigned shelves
- **Real-time Highlighting** : Navigate from book details directly to shelf locations
- **Dynamic Loading** : Upload custom SVG layouts to match your physical space

#### SVG File Format

The spatial visualization requires a properly formatted SVG file located at `public/kubes.svg` that can be uploaded directly from the application "Kubes" page. The format must follow these specifications:

**Required Structure:**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1659 812">
    <g id="kubes">
        <!-- Each location must be a group with ID starting with "kube" -->
        <g id="kube1">
            <!-- Outer rectangle (border) -->
            <rect id="outer-kube1" class="cls-1" x="100" y="100" width="195" height="95" />
            <!-- Inner rectangle (clickable area) -->
            <rect id="inner-kube1" class="cls-2" x="105" y="105" width="185" height="85" />
        </g>
        <g id="kube2">
            <rect id="outer-kube2" class="cls-1" x="300" y="100" width="195" height="95" />
            <rect id="inner-kube2" class="cls-3" x="305" y="105" width="185" height="85" />
        </g>
        <!-- ... more locations ... -->
    </g>
</svg>
```

**Naming Conventions:**

- **Group IDs** : Must start with `kube` followed by a number (e.g., `kube1`, `kube2`, `kube40`)
- **Rectangle IDs** :
    - Outer: `outer-kubeX` (where X matches the group number)
    - Inner: `inner-kubeX` (where X matches the group number)

**File Upload:**

- Navigate to the **Spatial Layout** page (`/kubes`)
- If no valid SVG is detected, an upload interface will appear
- Select your custom SVG file to replace `public/kubes.svg`
- The system will automatically reload and display your layout

**Example File:**
See `public/kubes_example.svg` for a complete working example with multiple shelf locations and styling.

## 🚀 Technologies Used

### Frontend

- **React 18** - Modern JavaScript framework
- **Vite** - Ultra-fast build tool
- **React Router DOM** - Client-side navigation
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Lucide React** - Modern icons

### UI Components

- **Radix UI** - Accessible and unstyled components
    - Dialog, Select, Toast, Tabs, etc.
- **Class Variance Authority** - Style variant management
- **Tailwind Merge** - Smart CSS class merging

### Development Tools

- **ESLint** - Code linting and formatting
- **PostCSS** - Advanced CSS processing
- **Autoprefixer** - Browser compatibility
- **Terser** - JavaScript minification

## 📁 Project Structure

```
library-ihm/
├── public/                     # Static files
├── src/
│   ├── components/            # Reusable components
│   │   ├── ui/               # Base UI components
│   │   ├── AddBookDialog.jsx
│   │   ├── AddAuthorDialog.jsx
│   │   ├── BookCard.jsx
│   │   ├── AuthorCard.jsx
│   │   ├── Layout.jsx
│   │   └── SearchBar.jsx
│   ├── pages/                # Main pages
│   │   ├── BooksPage.jsx
│   │   ├── AuthorsPage.jsx
│   │   └── ShelvesPage.jsx
│   ├── lib/                  # Utilities
│   │   └── utils.js
│   ├── App.jsx              # Main component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── plugins/                  # Custom Vite plugins
│   └── visual-editor/       # Integrated visual editor
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🛠️ Installation

### 🐳 Quick Start with Docker (Recommended)

The easiest way to get started is using our pre-built Docker images that support both **AMD64** (PC) and **ARM64** (Raspberry Pi 5).

#### Option 1: Complete Stack (Frontend + Backend + Database)

Deploy the entire application stack with one command:

```bash
# Download the full stack docker-compose
curl -O https://raw.githubusercontent.com/your-username/library-ihm/main/docker-compose.full.yml

# Start the complete application stack
docker-compose -f docker-compose.full.yml up -d

# Services will be available at:
# - Frontend: http://localhost (port 80)
# - Backend API: http://localhost:3001
# - MySQL Database: localhost:3306
```

This includes:

- **Frontend** : React application (library-ihm)
- **Backend** : Node.js API (library-ws)
- **Database** : MySQL 8.0 with initialization
- **Volumes** : Persistent data storage

#### Option 2: Frontend Only (External Backend)

If you already have a backend API running:

```bash
# Download the frontend-only docker-compose
curl -O https://raw.githubusercontent.com/your-username/library-ihm/main/docker-compose.yml

# Edit docker-compose.yml to set your API URL
# VITE_API_URL=https://your-api-url.com

# Start only the frontend
docker-compose up -d

# Access the application at http://localhost
```

#### Docker Multi-Architecture Support

Our Docker images are built for multiple architectures:

- **AMD64** : Standard PCs and servers
- **ARM64** : Raspberry Pi 5, Apple Silicon Macs, ARM servers

Docker automatically selects the correct architecture for your system.

#### Configuration

**For Complete Stack (`docker-compose.full.yml`):**

- Database credentials are pre-configured
- No additional configuration needed for local development

**For Frontend Only (`docker-compose.yml`):**
Edit the docker-compose.yml file to customize the API URL:

```yaml
environment:
    - VITE_API_URL=https://your-api-url.com
```

#### Environment Variables (Complete Stack)

| Variable       | Default                 | Description       |
| -------------- | ----------------------- | ----------------- |
| `VITE_API_URL` | `http://localhost:3001` | Backend API URL   |
| `DB_HOST`      | `mysql`                 | Database hostname |
| `DB_USER`      | `library_user`          | Database username |
| `DB_PASSWORD`  | `SecurePassword123`     | Database password |
| `DB_NAME`      | `library_db`            | Database name     |

### 🔧 Development Setup (From Sources)

For development or customization, install from sources:

#### Prerequisites

- **Node.js** (version 16 or higher)
- **npm** or **yarn**
- **Backend API** : [Library Web Service](https://github.com/Nespouique/library-ws) running

#### Full Stack Setup

##### 1. **Backend API Setup** (Required)

```bash
# Clone and setup the backend API first
git clone https://github.com/Nespouique/library-ws.git
cd library-ws
npm install

# Configure database (see backend README)
cp .env.example .env
# Edit .env with your MySQL settings

# Start the API server
npm run dev
# API will be available at http://localhost:3000
```

##### 2. **Frontend Interface Setup**

```bash
# Clone the frontend interface
git clone https://github.com/your-username/library-ihm.git
cd library-ihm

# Install dependencies
npm install

# Start development server
npm run dev

# Access the application at http://localhost:5173
```

##### 3. **API Integration**

The frontend is configured to communicate with the backend API:

- **API Base URL** : `http://localhost:3000` (development)
- **Endpoints** : `/books`, `/authors`, `/shelves`
- **Documentation** : Available at `http://localhost:3000/api-docs`

#### Available Scripts

```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# Preview build
npm run preview

# Code quality (coming soon)
npm run lint              # Check for ESLint errors
npm run lint:fix          # Auto-fix ESLint errors
npm run format            # Format code with Prettier
npm run format:check      # Check formatting without changing files
npm run quality           # Run both lint and format checks
npm run quality:fix       # Auto-fix both lint and format issues

# Complete validation (coming soon)
npm run validate          # Quality check + build (production ready)
```

#### Updating HTML5 custom

```bash
# Cleaning cache
npm cache clean --force

# Making sure new version is published
npm view html5-qrcode-nespouique versions

# Updating
npm install html5-qrcode-nespouique@X.X.X --legacy-peer-deps
```

## 🎨 User Interface

### Design System

- **Color Palette** : Modern theme with dark mode support
- **Typography** : System font optimized for readability
- **Animations** : Smooth transitions with Framer Motion
- **Responsive** : Adaptive interface for all screen sizes

### Navigation

- **Main Menu** : Quick access to the three main sections
- **Global Search** : Search bar available on all pages
- **Floating Buttons** : Main actions easily accessible

## 📱 Responsive Design

The application is fully responsive and optimized for:

- **Desktop** : Complete interface with sidebar and extended grids
- **Tablet** : Adaptive layout with optimized navigation
- **Mobile** : Mobile-first interface with touch navigation

## � API Integration

### Backend Dependencies

This frontend requires the [Library Web Service API](https://github.com/Nespouique/library-ws) to be running:

#### API Endpoints Used:

- **Authors** : `GET/POST/PUT/PATCH/DELETE /authors`
- **Books** : `GET/POST/PUT/PATCH/DELETE /books`
- **Shelves** : `GET/POST/PUT/PATCH/DELETE /shelves`

#### Data Flow:

1. **Frontend** makes HTTP requests to backend API
2. **Backend** processes requests and interacts with MySQL database
3. **API** returns JSON responses to frontend
4. **Frontend** updates UI with received data

#### Development Workflow:

1. Start backend API server (`npm run dev` in `library-ws`)
2. Start frontend dev server (`npm run dev` in `library-ihm`)
3. Both services work together seamlessly

### API Documentation

Complete API documentation is available via Swagger UI at:

```
http://localhost:3000/api-docs
```

## 🧪 Testing & Quality

### Code Quality (Coming Soon)

Following the same standards as the backend API:

- **ESLint** - Code quality and error detection
- **Prettier** - Code formatting and consistency
- **Quality Scripts** - Automated code validation

### Unit Testing (Planned)

- **React Testing Library** - Component testing
- **Jest** - Test runner and assertions
- **Coverage Reports** - Code coverage analysis

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

## 📞 Support

For any questions or issues, feel free to:

- Open an issue on GitHub
- Contact the development team

---

**Developed with ❤️ and hosted by Hostinger Horizons**
